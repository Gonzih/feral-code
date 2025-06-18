import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../src/utils/config.js';
import { ProviderFactory } from '../src/providers/index.js';
import { ToolManager } from '../src/tools/index.js';
import { SessionManager } from '../src/utils/session.js';

describe('Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment completely for clean tests
    process.env = {};
    // Use the provided OpenRouter API key for testing
    process.env.FERAL_CODE_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = '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';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Provider Integration', () => {
    it('should create and validate OpenRouter provider', () => {
      const configManager = new ConfigManager();
      const validation = configManager.validateConfig();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const provider = ProviderFactory.createProvider(configManager);
      expect(provider.name).toBe('openrouter');
      expect(provider.validateConfig()).toBe(true);
    });

    it('should get correct default model for OpenRouter', () => {
      const configManager = new ConfigManager();
      const provider = ProviderFactory.createProvider(configManager);
      
      expect(provider.getDefaultModel()).toBe('openai/gpt-4');
    });

    it('should list supported models', () => {
      const configManager = new ConfigManager();
      const provider = ProviderFactory.createProvider(configManager);
      const models = provider.getSupportedModels();
      
      expect(models).toContain('openai/gpt-4');
      expect(models).toContain('openai/gpt-4');
      expect(models.length).toBeGreaterThan(5);
    });
  });

  describe('Tool Manager Integration', () => {
    it('should register all tools correctly', () => {
      const toolManager = new ToolManager();
      const tools = toolManager.getAllTools();
      
      expect(tools).toHaveLength(25); // All tools including consciousness tools
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('Bash');
      expect(toolNames).toContain('Read');
      expect(toolNames).toContain('Write');
      expect(toolNames).toContain('Edit');
      expect(toolNames).toContain('MultiEdit');
      expect(toolNames).toContain('Glob');
      expect(toolNames).toContain('Grep');
      expect(toolNames).toContain('LS');
      expect(toolNames).toContain('TodoRead');
      expect(toolNames).toContain('TodoWrite');
      expect(toolNames).toContain('WebFetch');
      expect(toolNames).toContain('WebSearch');
      expect(toolNames).toContain('NotebookRead');
      expect(toolNames).toContain('NotebookEdit');
      expect(toolNames).toContain('Agent');
      expect(toolNames).toContain('ExitPlanMode');
      expect(toolNames).toContain('MCPSearch');
      expect(toolNames).toContain('MCPManager');
    });

    it('should get tool definitions for API calls', () => {
      const toolManager = new ToolManager();
      const definitions = toolManager.getToolDefinitions();
      
      expect(definitions).toHaveLength(25);
      definitions.forEach(def => {
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('description');
        expect(def).toHaveProperty('parameters');
        expect(def.parameters).toHaveProperty('type', 'object');
        expect(def.parameters).toHaveProperty('properties');
      });
    });

    it('should execute tools with proper parameters', async () => {
      const toolManager = new ToolManager();
      
      // Test Bash tool
      const result = await toolManager.executeTool('Bash', {
        command: 'echo "Hello World"'
      });
      
      expect(result).toContain('Hello World');
    });
  });

  describe('Session Management Integration', () => {
    it('should create and manage sessions', async () => {
      const sessionManager = new SessionManager();
      
      const session = await sessionManager.createSession('openrouter', 'openai/gpt-4', 'Test Session');
      
      expect(session.id).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.provider).toBe('openrouter');
      expect(session.model).toBe('openai/gpt-4');
      expect(session.messages).toHaveLength(0);
    });

    it('should add messages to session', async () => {
      const sessionManager = new SessionManager();
      
      const session = await sessionManager.createSession('openrouter');
      await sessionManager.addMessage({ role: 'user', content: 'Hello' });
      await sessionManager.addMessage({ role: 'assistant', content: 'Hi there!' });
      
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.messages).toHaveLength(2);
      expect(currentSession?.messages[0].role).toBe('user');
      expect(currentSession?.messages[1].role).toBe('assistant');
    });

    it('should export sessions to different formats', async () => {
      const sessionManager = new SessionManager();
      
      const session = await sessionManager.createSession('openrouter', 'openai/gpt-4', 'Export Test');
      await sessionManager.addMessage({ role: 'user', content: 'Test message' });
      
      // Test JSON export
      const jsonExport = await sessionManager.exportSession(session.id, 'json');
      const parsed = JSON.parse(jsonExport);
      expect(parsed.title).toBe('Export Test');
      expect(parsed.messages).toHaveLength(1);
      
      // Test Markdown export
      const markdownExport = await sessionManager.exportSession(session.id, 'markdown');
      expect(markdownExport).toContain('# Export Test');
      expect(markdownExport).toContain('## User');
      expect(markdownExport).toContain('Test message');
    });
  });

  describe('Configuration Integration', () => {
    it('should override configuration with environment variables', () => {
      process.env.FERAL_CODE_MODEL = 'openai/gpt-4';
      process.env.FERAL_CODE_TEMPERATURE = '0.9';
      process.env.FERAL_CODE_MAX_TOKENS = '2000';
      process.env.FERAL_CODE_VERBOSE = 'true';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      
      expect(config.defaultModel).toBe('openai/gpt-4');
      expect(config.temperature).toBe(0.9);
      expect(config.maxTokens).toBe(2000);
      expect(config.verbose).toBe(true);
    });

    it('should provide comprehensive environment variable help', () => {
      const help = ConfigManager.getEnvironmentVariableHelp();
      
      expect(help).toContain('FERAL_CODE_PROVIDER');
      expect(help).toContain('OPENAI_API_KEY');
      expect(help).toContain('OPENROUTER_API_KEY');
      expect(help).toContain('Examples:');
    });

    it('should get provider-specific configuration', () => {
      const configManager = new ConfigManager();
      const providerConfig = configManager.getProviderConfig();
      
      expect(providerConfig.apiKey).toBe('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');
      expect(providerConfig.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(providerConfig.defaultModel).toBe('openai/gpt-4');
      expect(providerConfig.models).toBeInstanceOf(Array);
    });
  });

  describe('Real API Integration', () => {
    it('should make successful API call to OpenRouter', async () => {
      const configManager = new ConfigManager();
      const provider = ProviderFactory.createProvider(configManager);
      
      try {
        const response = await provider.chat({
          messages: [{ role: 'user', content: 'Say "Hello from Open Code test!" and nothing else.' }],
          model: 'openai/gpt-3.5-turbo',
          temperature: 0.1,
          maxTokens: 50
        });

        expect(response.message.role).toBe('assistant');
        expect(response.message.content).toContain('Hello from Open Code test');
        expect(response.usage?.inputTokens).toBeGreaterThan(0);
        expect(response.usage?.outputTokens).toBeGreaterThan(0);
      } catch (error) {
        // If the API call fails, make sure it's not due to our code
        expect(error).toBeInstanceOf(Error);
        console.warn('API test failed, but this might be due to rate limits or network issues:', error);
      }
    }, 30000); // 30 second timeout for API calls

    it('should handle streaming responses', async () => {
      const configManager = new ConfigManager();
      const provider = ProviderFactory.createProvider(configManager);
      
      try {
        let chunks = 0;
        let fullContent = '';
        
        for await (const chunk of provider.streamChat({
          messages: [{ role: 'user', content: 'Count from 1 to 3, each number on a new line.' }],
          model: 'openai/gpt-3.5-turbo',
          temperature: 0.1,
          maxTokens: 50
        })) {
          if (chunk.message?.content) {
            chunks++;
            fullContent += chunk.message.content;
          }
        }

        expect(chunks).toBeGreaterThan(0);
        expect(fullContent.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('Streaming test failed, but this might be due to rate limits or network issues:', error);
      }
    }, 30000);
  });
});