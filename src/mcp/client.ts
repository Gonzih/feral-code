import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { 
  MCPServer, 
  MCPMessage, 
  MCPInitializeParams, 
  MCPInitializeResult,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolCall,
  MCPToolResult,
  MCPServerInfo
} from '../types/mcp.js';
import { diagnostics } from '../utils/diagnostics.js';

export class MCPClient extends EventEmitter {
  private server: MCPServer;
  private process?: ChildProcess;
  private messageId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private isInitialized = false;
  private tools: MCPTool[] = [];
  private resources: MCPResource[] = [];
  private prompts: MCPPrompt[] = [];

  constructor(server: MCPServer) {
    super();
    this.server = server;
  }

  async connect(): Promise<void> {
    try {
      await diagnostics.info('mcp', `Connecting to MCP server: ${this.server.name}`, {
        serverName: this.server.name,
        type: this.server.type,
      });

      if (this.server.type === 'stdio') {
        await this.connectStdio();
      } else {
        await this.connectHttp();
      }

      await this.initialize();
      await this.discoverCapabilities();

      await diagnostics.info('mcp', `Successfully connected to MCP server: ${this.server.name}`, {
        serverName: this.server.name,
        toolCount: this.tools.length,
        resourceCount: this.resources.length,
        promptCount: this.prompts.length,
      });

      this.emit('connected');
    } catch (error) {
      await diagnostics.error('mcp', `Failed to connect to MCP server: ${this.server.name}`, error as Error);
      this.emit('error', error);
      throw error;
    }
  }

  private async connectStdio(): Promise<void> {
    if (!this.server.command) {
      throw new Error('Command is required for stdio transport');
    }

    this.process = spawn(this.server.command, this.server.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...this.server.env },
    });

    this.process.stdout?.setEncoding('utf-8');
    this.process.stderr?.setEncoding('utf-8');

    this.process.stdout?.on('data', (data: string) => {
      this.handleMessage(data);
    });

    this.process.stderr?.on('data', (data: string) => {
      diagnostics.warn('mcp', `MCP server stderr: ${this.server.name}`, { stderr: data });
    });

    this.process.on('error', (error) => {
      this.emit('error', error);
    });

    this.process.on('exit', (code) => {
      if (code !== 0) {
        this.emit('error', new Error(`MCP server exited with code ${code}`));
      } else {
        this.emit('disconnected');
      }
    });
  }

  private async connectHttp(): Promise<void> {
    // HTTP/SSE connection would be implemented here
    // For now, focus on stdio which is most common
    throw new Error('HTTP transport not yet implemented');
  }

  private handleMessage(data: string): void {
    const lines = data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const message: MCPMessage = JSON.parse(line);
        
        if (message.id && this.pendingRequests.has(message.id)) {
          const { resolve, reject } = this.pendingRequests.get(message.id)!;
          this.pendingRequests.delete(message.id);
          
          if (message.error) {
            reject(new Error(`MCP Error: ${message.error.message}`));
          } else {
            resolve(message.result);
          }
        } else if (message.method) {
          // Handle notifications from server
          this.handleNotification(message);
        }
      } catch (error) {
        diagnostics.warn('mcp', `Failed to parse MCP message from ${this.server.name}`, { data: line });
      }
    }
  }

  private handleNotification(message: MCPMessage): void {
    switch (message.method) {
      case 'notifications/tools/list_changed':
        this.discoverTools();
        break;
      case 'notifications/resources/list_changed':
        this.discoverResources();
        break;
      case 'notifications/prompts/list_changed':
        this.discoverPrompts();
        break;
    }
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    const id = ++this.messageId;
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      const messageStr = JSON.stringify(message) + '\n';
      
      if (this.server.type === 'stdio' && this.process?.stdin) {
        this.process.stdin.write(messageStr);
      } else {
        reject(new Error('Not connected'));
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private async initialize(): Promise<void> {
    const params: MCPInitializeParams = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: { subscribe: true },
        prompts: {},
      },
      clientInfo: {
        name: 'AMAI CODE',
        version: '1.0.0',
      },
    };

    const result: MCPInitializeResult = await this.sendRequest('initialize', params);
    
    // Send initialized notification
    const initializedMessage: MCPMessage = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    };
    
    if (this.process?.stdin) {
      this.process.stdin.write(JSON.stringify(initializedMessage) + '\n');
    }

    this.isInitialized = true;
  }

  private async discoverCapabilities(): Promise<void> {
    await Promise.all([
      this.discoverTools(),
      this.discoverResources(),
      this.discoverPrompts(),
    ]);
  }

  private async discoverTools(): Promise<void> {
    try {
      const result = await this.sendRequest('tools/list');
      this.tools = (result.tools || []).map((tool: any) => ({
        ...tool,
        server: this.server.name,
      }));
      this.emit('tools_updated', this.tools);
    } catch (error) {
      diagnostics.warn('mcp', `Failed to discover tools from ${this.server.name}`, { error });
    }
  }

  private async discoverResources(): Promise<void> {
    try {
      const result = await this.sendRequest('resources/list');
      this.resources = (result.resources || []).map((resource: any) => ({
        ...resource,
        server: this.server.name,
      }));
      this.emit('resources_updated', this.resources);
    } catch (error) {
      diagnostics.warn('mcp', `Failed to discover resources from ${this.server.name}`, { error });
    }
  }

  private async discoverPrompts(): Promise<void> {
    try {
      const result = await this.sendRequest('prompts/list');
      this.prompts = (result.prompts || []).map((prompt: any) => ({
        ...prompt,
        server: this.server.name,
      }));
      this.emit('prompts_updated', this.prompts);
    } catch (error) {
      diagnostics.warn('mcp', `Failed to discover prompts from ${this.server.name}`, { error });
    }
  }

  async callTool(name: string, arguments_: Record<string, any>): Promise<MCPToolResult> {
    if (!this.isInitialized) {
      throw new Error('MCP client not initialized');
    }

    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found on server ${this.server.name}`);
    }

    try {
      const result = await this.sendRequest('tools/call', {
        name,
        arguments: arguments_,
      });

      await diagnostics.info('mcp', `Tool call successful: ${name}`, {
        serverName: this.server.name,
        toolName: name,
        resultLength: JSON.stringify(result).length,
      });

      return result;
    } catch (error) {
      await diagnostics.error('mcp', `Tool call failed: ${name}`, error as Error, {
        serverName: this.server.name,
        toolName: name,
      });
      throw error;
    }
  }

  async getResource(uri: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.sendRequest('resources/read', { uri });
      return result;
    } catch (error) {
      await diagnostics.error('mcp', `Resource read failed: ${uri}`, error as Error, {
        serverName: this.server.name,
        uri,
      });
      throw error;
    }
  }

  async getPrompt(name: string, arguments_?: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.sendRequest('prompts/get', {
        name,
        arguments: arguments_,
      });
      return result;
    } catch (error) {
      await diagnostics.error('mcp', `Prompt get failed: ${name}`, error as Error, {
        serverName: this.server.name,
        promptName: name,
      });
      throw error;
    }
  }

  getServerInfo(): MCPServerInfo {
    return {
      name: this.server.name,
      status: this.isInitialized ? 'connected' : 'connecting',
      tools: this.tools,
      resources: this.resources,
      prompts: this.prompts,
    };
  }

  getTools(): MCPTool[] {
    return this.tools;
  }

  getResources(): MCPResource[] {
    return this.resources;
  }

  getPrompts(): MCPPrompt[] {
    return this.prompts;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    this.isInitialized = false;
    this.pendingRequests.clear();
    this.emit('disconnected');

    await diagnostics.info('mcp', `Disconnected from MCP server: ${this.server.name}`);
  }
}