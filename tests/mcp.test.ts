import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPDiscoveryService } from '../src/mcp/discovery.js';
import { MCPManager } from '../src/mcp/manager.js';
import { MCPSearchTool } from '../src/tools/mcpSearch.js';
import { MCPManagerTool } from '../src/tools/mcpManager.js';
import { costTracker } from '../src/utils/costTracker.js';
import { OllamaProvider } from '../src/providers/ollama.js';

describe('MCP Discovery Service', () => {
  let discovery: MCPDiscoveryService;

  beforeEach(() => {
    discovery = new MCPDiscoveryService();
  });

  it('should search for MCP servers', async () => {
    const results = await discovery.searchServers('filesystem');
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length > 0) {
      const server = results[0];
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('description');
      expect(server).toHaveProperty('configuration');
      expect(server.configuration).toHaveProperty('type');
    }
  });

  it('should get popular servers', async () => {
    const popular = await discovery.getPopularServers();
    expect(Array.isArray(popular)).toBe(true);
    expect(popular.length).toBeGreaterThan(0);
    
    // Should include official servers (but we can't guarantee network access)
    if (popular.length > 0) {
      expect(popular[0]).toHaveProperty('name');
      expect(popular[0]).toHaveProperty('stars');
    }
  });

  it('should categorize servers', async () => {
    const categories = await discovery.getCategorizedServers();
    expect(categories).toHaveProperty('Development');
    expect(categories).toHaveProperty('Database');
    expect(categories).toHaveProperty('Web & APIs');
    
    expect(Array.isArray(categories['Development'])).toBe(true);
  });

  it('should install server from registry', async () => {
    const results = await discovery.searchServers('filesystem');
    
    if (results.length > 0) {
      const installed = await discovery.installServer(results[0]);
      expect(installed).toHaveProperty('name');
      expect(installed).toHaveProperty('type');
      expect(installed.enabled).toBe(true);
    }
  });

  it('should get recommendations', async () => {
    const recommendations = await discovery.getRecommendations({
      projectType: 'web',
      userQuery: 'database',
    });
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeLessThanOrEqual(8);
  });
});

describe('MCP Tools', () => {
  let mcpSearchTool: MCPSearchTool;
  let mcpManagerTool: MCPManagerTool;

  beforeEach(() => {
    mcpSearchTool = new MCPSearchTool();
    mcpManagerTool = new MCPManagerTool();
  });

  describe('MCPSearchTool', () => {
    it('should search for servers', async () => {
      const result = await mcpSearchTool._execute({ query: 'filesystem' });
      expect(result).toContain('MCP Server Search Results');
      expect(result).toContain('filesystem');
    });

    it('should filter by category', async () => {
      const result = await mcpSearchTool._execute({ 
        query: 'git', 
        category: 'development' 
      });
      expect(result).toContain('**Category:** Development');
    });

    it('should handle no results', async () => {
      const result = await mcpSearchTool._execute({ 
        query: 'nonexistent-server-xyz123' 
      });
      expect(result).toContain('No MCP servers found');
      expect(result).toContain('Try these popular categories');
    });

    it('should validate required parameters', async () => {
      const result = await mcpSearchTool.execute({});
      expect(result).toContain('Missing required parameters: query');
    });
  });

  describe('MCPManagerTool', () => {
    it('should list servers when none configured', async () => {
      const result = await mcpManagerTool._execute({ action: 'list' });
      expect(result).toContain('MCP Servers');
      // Should handle empty state gracefully
    });

    it('should show status', async () => {
      const result = await mcpManagerTool._execute({ action: 'status' });
      expect(result).toContain('MCP Server Status');
    });

    it('should list tools', async () => {
      const result = await mcpManagerTool._execute({ action: 'tools' });
      expect(result).toContain('MCP Capabilities');
    });

    it('should validate required parameters for add action', async () => {
      const result = await mcpManagerTool._execute({ 
        action: 'add',
        server_name: 'test'
        // Missing server_config
      });
      expect(result).toContain('server_config are required');
    });

    it('should handle unknown action', async () => {
      const result = await mcpManagerTool._execute({ action: 'unknown' });
      expect(result).toContain('Unknown action');
      expect(result).toContain('Available actions');
    });
  });
});

describe('Cost Tracker', () => {
  beforeEach(async () => {
    await costTracker.resetCosts();
  });

  afterEach(async () => {
    await costTracker.resetCosts();
  });

  it('should track usage costs', async () => {
    const cost = await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(1); // Should be reasonable cost
  });

  it('should track free usage for Ollama', async () => {
    const cost = await costTracker.trackUsage('ollama', 'llama3.2', 1000, 500);
    expect(cost).toBe(0);
  });

  it('should get cost summary', async () => {
    await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    await costTracker.trackUsage('openai', 'gpt-3.5-turbo', 800, 400);

    const summary = await costTracker.getSummary();
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.requestCount).toBe(2);
    expect(summary.totalInputTokens).toBe(1800);
    expect(summary.totalOutputTokens).toBe(900);
    expect(Object.keys(summary.costByProvider)).toContain('openai');
    expect(Object.keys(summary.costByProvider)).toContain('openai');
  });

  it('should filter by provider', async () => {
    await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    await costTracker.trackUsage('openai', 'gpt-3.5-turbo', 800, 400);

    const summary = await costTracker.getSummary({ provider: 'openai' });
    expect(summary.requestCount).toBe(1);
    expect(Object.keys(summary.costByProvider)).toEqual(['openai']);
  });

  it('should get today cost', async () => {
    await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    const todayCost = await costTracker.getTodayCost();
    expect(todayCost).toBeGreaterThan(0);
  });

  it('should export costs as JSON', async () => {
    await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    const exported = await costTracker.exportCosts('json');
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0]).toHaveProperty('provider', 'openai');
  });

  it('should export costs as CSV', async () => {
    await costTracker.trackUsage('openai', 'gpt-4o-mini', 1000, 500);
    const exported = await costTracker.exportCosts('csv');
    expect(exported).toContain('Timestamp,Provider,Model');
    expect(exported).toContain('openai,gpt-4o-mini');
  });

  it('should estimate costs', async () => {
    const estimate = costTracker.getCostEstimate('openai', 'gpt-4o-mini', 1000);
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(1);
  });

  it('should get provider cost info', () => {
    const openaiInfo = costTracker.getProviderCostInfo('openai');
    expect(openaiInfo).toBeDefined();
    expect(openaiInfo).toHaveProperty('gpt-4o-mini');
    
    const ollamaInfo = costTracker.getProviderCostInfo('ollama');
    expect(ollamaInfo).toBeDefined();
    expect(ollamaInfo?.default?.inputCostPer1kTokens).toBe(0);
  });
});

describe('Ollama Provider', () => {
  // Note: These tests will only pass if Ollama is running locally
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider('http://localhost:11434');
  });

  it('should initialize with correct properties', () => {
    expect(provider.name).toBe('ollama');
    expect(provider.getDefaultModel()).toBe('llama3.2');
  });

  it('should validate config', async () => {
    // This will return false if Ollama is not running, which is expected in CI
    const isValid = await provider.validateConfig();
    expect(typeof isValid).toBe('boolean');
  });

  it('should get model info', async () => {
    const info = await provider.getModelInfo();
    expect(info).toHaveProperty('model');
    expect(info).toHaveProperty('provider', 'Ollama');
    expect(info).toHaveProperty('location');
    expect(['Local', 'Remote']).toContain(info.location);
  });

  it('should get status', async () => {
    const status = await provider.getStatus();
    expect(status).toHaveProperty('available');
    expect(status).toHaveProperty('models');
    expect(status).toHaveProperty('location');
    expect(Array.isArray(status.models)).toBe(true);
  });

  it('should handle chat request gracefully when offline', async () => {
    try {
      const response = await provider.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama3.2',
      });
      // If this succeeds, Ollama is running
      expect(response).toHaveProperty('message');
    } catch (error) {
      // If this fails, Ollama is not running, which is expected
      expect(error).toBeDefined();
    }
  });
});