import { BaseTool } from './base.js';
import { MCPManager } from '../mcp/manager.js';
import { MCPDiscoveryService } from '../mcp/discovery.js';

// Global MCP manager instance
let mcpManager: MCPManager | null = null;

export class MCPManagerTool extends BaseTool {
  name = 'MCPManager';
  description = 'Manage MCP (Model Context Protocol) servers - list, add, remove, enable/disable servers and their tools.';
  parameters = {
    action: {
      type: 'string',
      description: 'Action to perform',
      required: true,
      enum: ['list', 'add', 'remove', 'enable', 'disable', 'status', 'tools', 'install'],
    },
    server_name: {
      type: 'string',
      description: 'Name of the MCP server (required for add/remove/enable/disable actions)',
    },
    server_config: {
      type: 'object',
      description: 'Server configuration for add action (type, command, args, env)',
    },
    registry_name: {
      type: 'string',
      description: 'Name from MCP registry to install (for install action)',
    },
  };

  private async getMCPManager(): Promise<MCPManager> {
    if (!mcpManager) {
      mcpManager = new MCPManager();
      await mcpManager.initialize();
    }
    return mcpManager;
  }

  async _execute(params: Record<string, any>): Promise<string> {
    const { action, server_name, server_config, registry_name } = params;

    try {
      const manager = await this.getMCPManager();

      switch (action) {
        case 'list':
          return await this.listServers(manager);
        
        case 'status':
          return await this.getStatus(manager);
        
        case 'tools':
          return await this.listTools(manager);
        
        case 'add':
          if (!server_name || !server_config) {
            return 'Error: server_name and server_config are required for add action';
          }
          return await this.addServer(manager, server_name, server_config);
        
        case 'remove':
          if (!server_name) {
            return 'Error: server_name is required for remove action';
          }
          return await this.removeServer(manager, server_name);
        
        case 'enable':
          if (!server_name) {
            return 'Error: server_name is required for enable action';
          }
          return await this.enableServer(manager, server_name);
        
        case 'disable':
          if (!server_name) {
            return 'Error: server_name is required for disable action';
          }
          return await this.disableServer(manager, server_name);
        
        case 'install':
          if (!registry_name) {
            return 'Error: registry_name is required for install action';
          }
          return await this.installFromRegistry(manager, registry_name);
        
        default:
          return `Error: Unknown action '${action}'. Available actions: list, add, remove, enable, disable, status, tools, install`;
      }
    } catch (error) {
      return `Error managing MCP servers: ${(error as Error).message}`;
    }
  }

  private async listServers(manager: MCPManager): Promise<string> {
    const servers = manager.getServers();
    const connectedServers = manager.getConnectedServers();
    
    if (servers.length === 0) {
      return `# 📦 MCP Servers

No MCP servers configured.

**Popular servers to get started:**
- **filesystem**: Access local files and directories
- **git**: Git version control operations  
- **github**: GitHub repository management
- **puppeteer**: Web browser automation

Use MCPSearch tool to discover more servers, or install one:
\`\`\`
MCPManager action=install registry_name=filesystem
\`\`\``;
    }

    const output = ['# 📦 MCP Servers Configuration', ''];
    
    for (const server of servers) {
      const connected = connectedServers.find(c => c.name === server.name);
      const status = connected ? connected.status : 'disconnected';
      const statusIcon = this.getStatusIcon(status, server.enabled);
      
      output.push(`## ${statusIcon} ${server.name}`);
      output.push(`**Status:** ${server.enabled ? status : 'disabled'}`);
      output.push(`**Type:** ${server.type}`);
      
      if (server.description) {
        output.push(`**Description:** ${server.description}`);
      }
      
      if (server.command) {
        output.push(`**Command:** ${server.command} ${(server.args || []).join(' ')}`);
      }
      
      if (connected && connected.tools.length > 0) {
        output.push(`**Tools:** ${connected.tools.length} available`);
      }
      
      output.push('');
    }

    const totalTools = connectedServers.reduce((sum, server) => sum + server.tools.length, 0);
    output.push(`**Summary:** ${servers.length} server(s) configured, ${connectedServers.length} connected, ${totalTools} total tools available`);

    return output.join('\n');
  }

  private async getStatus(manager: MCPManager): Promise<string> {
    const statuses = manager.getServerStatus();
    const connectedServers = manager.getConnectedServers();
    
    const output = ['# 🔌 MCP Server Status', ''];
    
    if (statuses.length === 0) {
      return '# 🔌 MCP Server Status\n\nNo MCP servers configured.';
    }

    for (const status of statuses) {
      const statusIcon = this.getStatusIcon(status.status, true);
      output.push(`${statusIcon} **${status.name}**: ${status.status}`);
      
      if (status.error) {
        output.push(`  ❌ Error: ${status.error}`);
      }
      
      const serverInfo = connectedServers.find(s => s.name === status.name);
      if (serverInfo) {
        output.push(`  🔧 Tools: ${serverInfo.tools.length}`);
        output.push(`  📄 Resources: ${serverInfo.resources.length}`);
        output.push(`  💬 Prompts: ${serverInfo.prompts.length}`);
      }
      
      output.push('');
    }

    return output.join('\n');
  }

  private async listTools(manager: MCPManager): Promise<string> {
    const allTools = manager.getAllTools();
    const resources = manager.getAllResources();
    const prompts = manager.getAllPrompts();
    
    if (allTools.length === 0 && resources.length === 0 && prompts.length === 0) {
      return '# 🛠️ MCP Capabilities\n\nNo tools, resources, or prompts available. Connect some MCP servers first.';
    }

    const output = ['# 🛠️ MCP Capabilities', ''];
    
    if (allTools.length > 0) {
      output.push('## 🔧 Tools');
      for (const tool of allTools) {
        output.push(`- **${tool.name}** (${tool.server}): ${tool.description}`);
      }
      output.push('');
    }
    
    if (resources.length > 0) {
      output.push('## 📄 Resources');
      for (const resource of resources) {
        output.push(`- **${resource.name}** (${resource.server}): ${resource.uri}`);
        if (resource.description) {
          output.push(`  ${resource.description}`);
        }
      }
      output.push('');
    }
    
    if (prompts.length > 0) {
      output.push('## 💬 Prompts');
      for (const prompt of prompts) {
        output.push(`- **${prompt.name}** (${prompt.server})`);
        if (prompt.description) {
          output.push(`  ${prompt.description}`);
        }
      }
      output.push('');
    }

    output.push(`**Total:** ${allTools.length} tools, ${resources.length} resources, ${prompts.length} prompts`);

    return output.join('\n');
  }

  private async addServer(manager: MCPManager, name: string, config: any): Promise<string> {
    const server = {
      name,
      enabled: true,
      ...config,
    };

    await manager.addServer(server);
    return `✅ Successfully added MCP server '${name}'. It will be automatically connected.`;
  }

  private async removeServer(manager: MCPManager, name: string): Promise<string> {
    await manager.removeServer(name);
    return `✅ Successfully removed MCP server '${name}'.`;
  }

  private async enableServer(manager: MCPManager, name: string): Promise<string> {
    await manager.enableServer(name);
    return `✅ Successfully enabled MCP server '${name}'. Connecting...`;
  }

  private async disableServer(manager: MCPManager, name: string): Promise<string> {
    await manager.disableServer(name);
    return `✅ Successfully disabled MCP server '${name}'. Disconnected.`;
  }

  private async installFromRegistry(manager: MCPManager, registryName: string): Promise<string> {
    const discovery = new MCPDiscoveryService();
    
    // Search for the server in the registry
    const results = await discovery.searchServers(registryName);
    const exactMatch = results.find(r => 
      r.name === registryName || 
      r.name.includes(registryName) ||
      this.sanitizeName(r.name) === registryName
    );

    if (!exactMatch) {
      return `❌ Server '${registryName}' not found in registry. Use MCPSearch to find available servers.`;
    }

    // Install the server
    const server = await discovery.installServer(exactMatch);
    await manager.addServer(server);

    return `✅ Successfully installed MCP server '${server.name}' from registry.

**Details:**
- **Name:** ${server.name}
- **Description:** ${exactMatch.description}
- **Install Command:** ${exactMatch.installCommand}

The server is now enabled and connecting. Use MCPManager action=status to check connection status.`;
  }

  private getStatusIcon(status: string, enabled: boolean): string {
    if (!enabled) return '⏸️';
    
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      case 'disconnected': return '⚪';
      default: return '❓';
    }
  }

  private sanitizeName(name: string): string {
    return name
      .replace(/^@.*?\//, '')
      .replace(/^server-/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
  }
}