import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../src/utils/config.js';

describe('ConfigManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment completely for clean tests
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default configuration', () => {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();
    
    expect(config.provider).toBe('openai');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(4000);
  });

  it('should load configuration from environment variables', () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    process.env.FERAL_CODE_TEMPERATURE = '0.5';
    process.env.FERAL_CODE_MAX_TOKENS = '2000';
    process.env.FERAL_CODE_VERBOSE = 'true';
    
    const configManager = new ConfigManager();
    const config = configManager.getConfig();
    
    expect(config.provider).toBe('openai');
    expect(config.temperature).toBe(0.5);
    expect(config.maxTokens).toBe(2000);
    expect(config.verbose).toBe(true);
  });

  it('should validate configuration correctly', () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    
    const configManager = new ConfigManager();
    const validation = configManager.validateConfig();
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should return validation errors for missing API key', () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    
    const configManager = new ConfigManager();
    const validation = configManager.validateConfig();
    
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('OpenAI API key not found. Set OPENAI_API_KEY environment variable.');
  });

  it('should get provider configuration for OpenAI', () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    
    const configManager = new ConfigManager();
    const providerConfig = configManager.getProviderConfig();
    
    expect(providerConfig.apiKey).toBe('test-key');
    expect(providerConfig.defaultModel).toBe('gpt-4-turbo-preview');
    expect(providerConfig.models).toContain('gpt-4-turbo-preview');
  });


  it('should get provider configuration for OpenRouter', () => {
    process.env.FERAL_CODE_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const configManager = new ConfigManager();
    const providerConfig = configManager.getProviderConfig();
    
    expect(providerConfig.apiKey).toBe('test-key');
    expect(providerConfig.defaultModel).toBe('anthropic/claude-3.5-sonnet');
    expect(providerConfig.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(providerConfig.models).toContain('anthropic/claude-3.5-sonnet');
  });
});