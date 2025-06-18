import { EventEmitter } from 'events';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { MCPClient } from './client.js';
import { MCPServer, MCPConfig, MCPServerInfo, MCPTool, MCPResource, MCPPrompt } from '../types/mcp.js';
import { diagnostics } from '../utils/diagnostics.js';

export class MCPManager extends EventEmitter {
  private clients = new Map<string, MCPClient>();
  private configPath: string;
  private servers: Map<string, MCPServer> = new Map();

  constructor() {
    super();
    this.configPath = join(homedir(), '.amai-code', 'mcp.json');
  }

  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.connectEnabledServers();
      
      await diagnostics.info('mcp', 'MCP Manager initialized', {
        serverCount: this.servers.size,
        enabledCount: Array.from(this.servers.values()).filter(s => s.enabled).length,
      });
    } catch (error) {
      await diagnostics.error('mcp', 'Failed to initialize MCP Manager', error as Error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      const config: MCPConfig = JSON.parse(content);
      
      this.servers.clear();
      for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
        this.servers.set(name, {
          name,
          enabled: true, // Default to enabled
          ...serverConfig,
        });
      }
    } catch (error) {
      // Config file doesn't exist or is invalid, start with empty config
      await diagnostics.info('mcp', 'No MCP config found, starting with empty configuration');
    }
  }

  async saveConfig(): Promise<void> {
    try {
      await mkdir(dirname(this.configPath), { recursive: true });
      
      const config: MCPConfig = {
        mcpServers: {},
      };

      for (const [name, server] of this.servers) {
        const { name: _, enabled: __, ...serverConfig } = server;
        config.mcpServers[name] = serverConfig;
      }

      await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      await diagnostics.info('mcp', 'MCP configuration saved');
    } catch (error) {
      await diagnostics.error('mcp', 'Failed to save MCP configuration', error as Error);
      throw error;
    }
  }

  async addServer(server: MCPServer): Promise<void> {
    this.servers.set(server.name, server);
    await this.saveConfig();

    if (server.enabled) {
      await this.connectServer(server.name);
    }

    this.emit('server_added', server);
    await diagnostics.info('mcp', `Added MCP server: ${server.name}`, { serverName: server.name });
  }

  async removeServer(name: string): Promise<void> {
    await this.disconnectServer(name);
    this.servers.delete(name);
    await this.saveConfig();

    this.emit('server_removed', name);
    await diagnostics.info('mcp', `Removed MCP server: ${name}`, { serverName: name });
  }

  async enableServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server '${name}' not found`);
    }

    server.enabled = true;
    await this.saveConfig();
    await this.connectServer(name);

    this.emit('server_enabled', name);
  }

  async disableServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server '${name}' not found`);
    }

    server.enabled = false;
    await this.saveConfig();
    await this.disconnectServer(name);

    this.emit('server_disabled', name);
  }

  private async connectEnabledServers(): Promise<void> {
    const enabledServers = Array.from(this.servers.values()).filter(s => s.enabled);
    
    await Promise.allSettled(
      enabledServers.map(server => this.connectServer(server.name))
    );
  }

  private async connectServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server '${name}' not found`);
    }

    // Disconnect if already connected
    await this.disconnectServer(name);

    const client = new MCPClient(server);
    
    client.on('connected', () => {
      this.emit('server_connected', name);
    });

    client.on('disconnected', () => {
      this.clients.delete(name);
      this.emit('server_disconnected', name);
    });

    client.on('error', (error) => {
      this.clients.delete(name);
      this.emit('server_error', name, error);
    });

    client.on('tools_updated', (tools) => {
      this.emit('tools_updated', name, tools);
    });

    client.on('resources_updated', (resources) => {
      this.emit('resources_updated', name, resources);
    });

    client.on('prompts_updated', (prompts) => {
      this.emit('prompts_updated', name, prompts);
    });

    this.clients.set(name, client);
    await client.connect();
  }

  private async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  async disconnectAll(): Promise<void> {
    await Promise.allSettled(
      Array.from(this.clients.keys()).map(name => this.disconnectServer(name))
    );
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getConnectedServers(): MCPServerInfo[] {
    return Array.from(this.clients.values()).map(client => client.getServerInfo());
  }

  getAllTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const client of this.clients.values()) {
      tools.push(...client.getTools());
    }
    return tools;
  }

  getAllResources(): MCPResource[] {
    const resources: MCPResource[] = [];
    for (const client of this.clients.values()) {
      resources.push(...client.getResources());
    }
    return resources;
  }

  getAllPrompts(): MCPPrompt[] {
    const prompts: MCPPrompt[] = [];
    for (const client of this.clients.values()) {
      prompts.push(...client.getPrompts());
    }
    return prompts;
  }

  async callTool(serverName: string, toolName: string, arguments_: Record<string, any>): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server '${serverName}' not connected`);
    }

    return await client.callTool(toolName, arguments_);
  }

  async getResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server '${serverName}' not connected`);
    }

    return await client.getResource(uri);
  }

  async getPrompt(serverName: string, promptName: string, arguments_?: Record<string, any>): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server '${serverName}' not connected`);
    }

    return await client.getPrompt(promptName, arguments_);
  }

  getServerStatus(): Array<{ name: string; status: string; error?: string }> {
    const statuses: Array<{ name: string; status: string; error?: string }> = [];
    
    for (const [name, server] of this.servers) {
      if (!server.enabled) {
        statuses.push({ name, status: 'disabled' });
        continue;
      }

      const client = this.clients.get(name);
      if (!client) {
        statuses.push({ name, status: 'disconnected' });
      } else {
        const info = client.getServerInfo();
        statuses.push({ name, status: info.status, error: info.error });
      }
    }

    return statuses;
  }

  // Pre-configured popular MCP servers for easy setup
  getPopularServers(): Partial<MCPServer>[] {
    return [
      {
        name: 'filesystem',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        description: 'Local filesystem access for reading and writing files',
      },
      {
        name: 'github',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        description: 'GitHub repository and issue management',
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: '',
        },
      },
      {
        name: 'git',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git', '--repository', process.cwd()],
        description: 'Git version control operations',
      },
      {
        name: 'puppeteer',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        description: 'Web browser automation and scraping',
      },
      {
        name: 'postgres',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        description: 'PostgreSQL database access',
        env: {
          POSTGRES_CONNECTION_STRING: '',
        },
      },
    ];
  }
}