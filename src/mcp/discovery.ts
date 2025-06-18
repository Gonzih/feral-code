import fetch from 'node-fetch';
import { MCPServer } from '../types/mcp.js';
import { diagnostics } from '../utils/diagnostics.js';

export interface MCPServerRegistry {
  name: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  installCommand: string;
  configuration: Partial<MCPServer>;
  stars?: number;
  downloads?: number;
  lastUpdated?: string;
}

export class MCPDiscoveryService {
  private cache: MCPServerRegistry[] = [];
  private cacheExpiry = 0;
  private readonly cacheDuration = 1000 * 60 * 60; // 1 hour

  async searchServers(query: string): Promise<MCPServerRegistry[]> {
    await this.refreshCache();
    
    const normalizedQuery = query.toLowerCase();
    
    return this.cache.filter(server => 
      server.name.toLowerCase().includes(normalizedQuery) ||
      server.description.toLowerCase().includes(normalizedQuery) ||
      server.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
    ).slice(0, 10); // Limit to top 10 results
  }

  async getPopularServers(): Promise<MCPServerRegistry[]> {
    await this.refreshCache();
    
    return this.cache
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 20);
  }

  async getCategorizedServers(): Promise<Record<string, MCPServerRegistry[]>> {
    await this.refreshCache();
    
    const categories: Record<string, MCPServerRegistry[]> = {
      'Development': [],
      'Database': [],
      'Web & APIs': [],
      'Cloud & Infrastructure': [],
      'AI & ML': [],
      'Productivity': [],
      'Other': [],
    };

    for (const server of this.cache) {
      let categorized = false;
      
      if (this.hasKeywords(server, ['git', 'github', 'development', 'code', 'repo'])) {
        categories['Development'].push(server);
        categorized = true;
      }
      
      if (this.hasKeywords(server, ['database', 'sql', 'postgres', 'mysql', 'mongo'])) {
        categories['Database'].push(server);
        categorized = true;
      }
      
      if (this.hasKeywords(server, ['web', 'api', 'http', 'scraping', 'browser'])) {
        categories['Web & APIs'].push(server);
        categorized = true;
      }
      
      if (this.hasKeywords(server, ['aws', 'cloud', 'docker', 'kubernetes', 'terraform'])) {
        categories['Cloud & Infrastructure'].push(server);
        categorized = true;
      }
      
      if (this.hasKeywords(server, ['ai', 'ml', 'openai', 'anthropic', 'model'])) {
        categories['AI & ML'].push(server);
        categorized = true;
      }
      
      if (this.hasKeywords(server, ['calendar', 'email', 'slack', 'notion'])) {
        categories['Productivity'].push(server);
        categorized = true;
      }
      
      if (!categorized) {
        categories['Other'].push(server);
      }
    }

    return categories;
  }

  private hasKeywords(server: MCPServerRegistry, keywords: string[]): boolean {
    const searchText = `${server.name} ${server.description} ${server.keywords.join(' ')}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  }

  private async refreshCache(): Promise<void> {
    if (Date.now() < this.cacheExpiry && this.cache.length > 0) {
      return;
    }

    try {
      await diagnostics.info('mcp', 'Refreshing MCP server discovery cache');
      
      // Fetch from multiple sources
      const [npmResults, githubResults, builtinServers] = await Promise.allSettled([
        this.fetchFromNpm(),
        this.fetchFromGitHub(),
        this.getBuiltinServers(),
      ]);

      this.cache = [];
      
      if (npmResults.status === 'fulfilled') {
        this.cache.push(...npmResults.value);
      }
      
      if (githubResults.status === 'fulfilled') {
        this.cache.push(...githubResults.value);
      }
      
      if (builtinServers.status === 'fulfilled') {
        this.cache.push(...builtinServers.value);
      }

      // Deduplicate by name
      const uniqueServers = new Map<string, MCPServerRegistry>();
      for (const server of this.cache) {
        if (!uniqueServers.has(server.name) || 
            (server.stars || 0) > (uniqueServers.get(server.name)?.stars || 0)) {
          uniqueServers.set(server.name, server);
        }
      }
      
      this.cache = Array.from(uniqueServers.values());
      this.cacheExpiry = Date.now() + this.cacheDuration;

      await diagnostics.info('mcp', `Cached ${this.cache.length} MCP servers`);
    } catch (error) {
      await diagnostics.error('mcp', 'Failed to refresh MCP discovery cache', error as Error);
    }
  }

  private async fetchFromNpm(): Promise<MCPServerRegistry[]> {
    try {
      const response = await fetch('https://registry.npmjs.org/-/v1/search?text=mcp-server&size=100');
      const data = await response.json() as any;
      
      return data.objects?.map((pkg: any) => ({
        name: pkg.package.name,
        description: pkg.package.description || '',
        author: pkg.package.author?.name || pkg.package.publisher?.username || '',
        homepage: pkg.package.links?.homepage,
        repository: pkg.package.links?.repository,
        keywords: pkg.package.keywords || [],
        installCommand: `npm install ${pkg.package.name}`,
        configuration: {
          type: 'stdio' as const,
          command: 'npx',
          args: ['-y', pkg.package.name],
        },
        downloads: pkg.package.date ? 1 : 0, // Proxy for popularity
        lastUpdated: pkg.package.date,
      })) || [];
    } catch (error) {
      await diagnostics.warn('mcp', 'Failed to fetch MCP servers from NPM', { error });
      return [];
    }
  }

  private async fetchFromGitHub(): Promise<MCPServerRegistry[]> {
    try {
      // Search GitHub for MCP servers
      const response = await fetch('https://api.github.com/search/repositories?q=mcp+server+topic:mcp&sort=stars&per_page=50', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Open-Code-MCP-Discovery',
        },
      });
      
      const data = await response.json() as any;
      
      return data.items?.map((repo: any) => ({
        name: repo.name,
        description: repo.description || '',
        author: repo.owner?.login || '',
        homepage: repo.homepage,
        repository: repo.html_url,
        keywords: repo.topics || [],
        installCommand: `git clone ${repo.clone_url}`,
        configuration: {
          type: 'stdio' as const,
          command: 'node',
          args: ['index.js'], // Default, may need customization
        },
        stars: repo.stargazers_count,
        lastUpdated: repo.updated_at,
      })) || [];
    } catch (error) {
      await diagnostics.warn('mcp', 'Failed to fetch MCP servers from GitHub', { error });
      return [];
    }
  }

  private async getBuiltinServers(): Promise<MCPServerRegistry[]> {
    return [
      {
        name: '@modelcontextprotocol/server-filesystem',
        description: 'MCP server for filesystem operations, providing secure file access',
        author: 'Anthropic',
        homepage: 'https://github.com/modelcontextprotocol/servers',
        repository: 'https://github.com/modelcontextprotocol/servers',
        keywords: ['filesystem', 'files', 'official'],
        installCommand: 'npx @modelcontextprotocol/server-filesystem',
        configuration: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
        stars: 1000,
      },
      {
        name: '@modelcontextprotocol/server-github',
        description: 'MCP server for GitHub API access, manage repositories and issues',
        author: 'Anthropic',
        homepage: 'https://github.com/modelcontextprotocol/servers',
        repository: 'https://github.com/modelcontextprotocol/servers',
        keywords: ['github', 'git', 'repositories', 'official'],
        installCommand: 'npx @modelcontextprotocol/server-github',
        configuration: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: '',
          },
        },
        stars: 1000,
      },
      {
        name: '@modelcontextprotocol/server-git',
        description: 'MCP server for Git operations, version control management',
        author: 'Anthropic',
        homepage: 'https://github.com/modelcontextprotocol/servers',
        repository: 'https://github.com/modelcontextprotocol/servers',
        keywords: ['git', 'version-control', 'official'],
        installCommand: 'npx @modelcontextprotocol/server-git',
        configuration: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
        stars: 900,
      },
      {
        name: '@modelcontextprotocol/server-puppeteer',
        description: 'MCP server for web automation using Puppeteer',
        author: 'Anthropic',
        homepage: 'https://github.com/modelcontextprotocol/servers',
        repository: 'https://github.com/modelcontextprotocol/servers',
        keywords: ['puppeteer', 'web', 'automation', 'browser', 'official'],
        installCommand: 'npx @modelcontextprotocol/server-puppeteer',
        configuration: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        },
        stars: 800,
      },
      {
        name: '@modelcontextprotocol/server-postgres',
        description: 'MCP server for PostgreSQL database access',
        author: 'Anthropic',
        homepage: 'https://github.com/modelcontextprotocol/servers',
        repository: 'https://github.com/modelcontextprotocol/servers',
        keywords: ['postgres', 'database', 'sql', 'official'],
        installCommand: 'npx @modelcontextprotocol/server-postgres',
        configuration: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres'],
          env: {
            POSTGRES_CONNECTION_STRING: '',
          },
        },
        stars: 700,
      },
    ];
  }

  async installServer(registry: MCPServerRegistry): Promise<MCPServer> {
    const server: MCPServer = {
      name: this.sanitizeName(registry.name),
      description: registry.description,
      enabled: true,
      type: registry.configuration.type || 'stdio',
      ...registry.configuration,
    };

    await diagnostics.info('mcp', `Installing MCP server: ${registry.name}`, {
      serverName: registry.name,
      installCommand: registry.installCommand,
    });

    return server;
  }

  private sanitizeName(name: string): string {
    // Remove npm package prefixes and make it a clean name
    return name
      .replace(/^@.*?\//, '')
      .replace(/^server-/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
  }

  async getRecommendations(context: {
    currentTools?: string[];
    projectType?: string;
    userQuery?: string;
  }): Promise<MCPServerRegistry[]> {
    await this.refreshCache();

    const recommendations: MCPServerRegistry[] = [];
    
    // Always recommend core servers
    const coreServers = ['filesystem', 'git', 'github'];
    recommendations.push(
      ...this.cache.filter(s => coreServers.some(core => s.name.includes(core)))
    );

    // Context-based recommendations
    if (context.projectType) {
      const projectKeywords = this.getProjectKeywords(context.projectType);
      recommendations.push(
        ...this.cache.filter(s => 
          projectKeywords.some(keyword => 
            s.keywords.includes(keyword) || 
            s.description.toLowerCase().includes(keyword)
          )
        )
      );
    }

    // Query-based recommendations
    if (context.userQuery) {
      const queryResults = await this.searchServers(context.userQuery);
      recommendations.push(...queryResults);
    }

    // Remove duplicates and limit
    const unique = Array.from(
      new Map(recommendations.map(r => [r.name, r])).values()
    );

    return unique.slice(0, 8);
  }

  private getProjectKeywords(projectType: string): string[] {
    const typeMap: Record<string, string[]> = {
      'web': ['web', 'http', 'api', 'browser', 'puppeteer'],
      'node': ['javascript', 'typescript', 'npm'],
      'python': ['python', 'pip'],
      'database': ['database', 'sql', 'postgres', 'mysql'],
      'cloud': ['aws', 'docker', 'kubernetes'],
      'ai': ['ai', 'openai', 'anthropic', 'model'],
    };

    return typeMap[projectType.toLowerCase()] || [];
  }
}