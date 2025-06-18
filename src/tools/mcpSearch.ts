import { BaseTool } from './base.js';
import { MCPDiscoveryService } from '../mcp/discovery.js';

export class MCPSearchTool extends BaseTool {
  name = 'MCPSearch';
  description = 'Search and discover MCP servers based on user requirements. Helps find tools and integrations for specific tasks.';
  parameters = {
    query: {
      type: 'string',
      description: 'Search query for MCP servers (e.g., "database", "github", "web scraping")',
      required: true,
    },
    category: {
      type: 'string',
      description: 'Filter by category: development, database, web, cloud, ai, productivity',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results to return (default: 5)',
    },
  };

  private discoveryService = new MCPDiscoveryService();

  async _execute(params: Record<string, any>): Promise<string> {
    const { query, category, limit = 5 } = params;

    try {
      let results;

      if (category) {
        const categorized = await this.discoveryService.getCategorizedServers();
        results = categorized[this.capitalizeFirst(category)] || [];
        
        if (query) {
          // Further filter by query within category
          const normalizedQuery = query.toLowerCase();
          results = results.filter(server => 
            server.name.toLowerCase().includes(normalizedQuery) ||
            server.description.toLowerCase().includes(normalizedQuery) ||
            server.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
          );
        }
      } else {
        results = await this.discoveryService.searchServers(query);
      }

      if (results.length === 0) {
        return `No MCP servers found for query: "${query}"${category ? ` in category: ${category}` : ''}

Try these popular categories:
- development (Git, GitHub, code tools)
- database (PostgreSQL, MySQL, data access)
- web (Browser automation, APIs, scraping)  
- cloud (AWS, Docker, infrastructure)
- ai (AI models, OpenAI integration)
- productivity (Slack, email, calendars)

Or search for specific tools like "filesystem", "git", "database", "browser".`;
      }

      const limitedResults = results.slice(0, limit);
      const output = ['# 🔍 MCP Server Search Results', ''];

      if (category) {
        output.push(`**Category:** ${this.capitalizeFirst(category)}`);
        if (query) output.push(`**Query:** ${query}`);
        output.push('');
      } else {
        output.push(`**Search:** ${query}`);
        output.push('');
      }

      output.push(`Found ${results.length} server(s), showing top ${limitedResults.length}:`);
      output.push('');

      for (const [index, server] of limitedResults.entries()) {
        output.push(`## ${index + 1}. ${server.name}`);
        output.push(`**Description:** ${server.description}`);
        output.push(`**Author:** ${server.author}`);
        
        if (server.keywords.length > 0) {
          output.push(`**Keywords:** ${server.keywords.join(', ')}`);
        }
        
        if (server.stars) {
          output.push(`**Stars:** ⭐ ${server.stars}`);
        }
        
        output.push(`**Install:** \`${server.installCommand}\``);
        
        if (server.repository) {
          output.push(`**Repository:** ${server.repository}`);
        }
        
        // Show basic configuration
        const config = server.configuration;
        if (config.command && config.args) {
          output.push(`**Quick Setup:**`);
          output.push(`\`\`\`json`);
          output.push(`{`);
          output.push(`  "name": "${this.sanitizeName(server.name)}",`);
          output.push(`  "type": "${config.type}",`);
          output.push(`  "command": "${config.command}",`);
          output.push(`  "args": ${JSON.stringify(config.args)}`);
          if (config.env) {
            output.push(`  "env": ${JSON.stringify(config.env, null, 4)}`);
          }
          output.push(`}`);
          output.push(`\`\`\``);
        }
        
        output.push('');
      }

      if (results.length > limit) {
        output.push(`*Showing ${limit} of ${results.length} results. Use a more specific query or increase the limit to see more.*`);
      }

      return output.join('\n');
    } catch (error) {
      return `Error searching MCP servers: ${(error as Error).message}`;
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private sanitizeName(name: string): string {
    return name
      .replace(/^@.*?\//, '')
      .replace(/^server-/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
  }
}