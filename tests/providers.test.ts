import { describe, it, expect, vi } from 'vitest';
import { OpenAIProvider, OpenRouterProvider, ProviderFactory } from '../src/providers/index.js';
import { ConfigManager } from '../src/utils/config.js';

// Mock fetch
global.fetch = vi.fn();

describe('ProviderFactory', () => {
  it('should create OpenAI provider as default', () => {
    const configManager = new ConfigManager();
    configManager.updateConfig({ provider: 'openai' });
    
    const provider = ProviderFactory.createProvider(configManager);
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.name).toBe('openai');
  });

  it('should create OpenRouter provider', () => {
    const configManager = new ConfigManager();
    configManager.updateConfig({ provider: 'openrouter' });
    
    const provider = ProviderFactory.createProvider(configManager);
    expect(provider).toBeInstanceOf(OpenRouterProvider);
    expect(provider.name).toBe('openrouter');
  });

  it('should throw error for unknown provider', () => {
    const configManager = new ConfigManager();
    configManager.updateConfig({ provider: 'unknown' as any });
    
    expect(() => ProviderFactory.createProvider(configManager))
      .toThrow('Unknown provider: unknown');
  });
});


describe('OpenAIProvider', () => {
  it('should validate configuration', () => {
    const provider = new OpenAIProvider('test-key');
    expect(provider.validateConfig()).toBe(true);
    
    const emptyProvider = new OpenAIProvider('');
    expect(emptyProvider.validateConfig()).toBe(false);
  });

  it('should return correct default model', () => {
    const provider = new OpenAIProvider('test-key');
    expect(provider.getDefaultModel()).toBe('gpt-4-turbo-preview');
  });

  it('should return supported models', () => {
    const provider = new OpenAIProvider('test-key');
    const models = provider.getSupportedModels();
    expect(models).toContain('gpt-4-turbo-preview');
    expect(models).toContain('gpt-3.5-turbo');
  });
});

describe('OpenRouterProvider', () => {
  it('should validate configuration', () => {
    const provider = new OpenRouterProvider('test-key');
    expect(provider.validateConfig()).toBe(true);
    
    const emptyProvider = new OpenRouterProvider('');
    expect(emptyProvider.validateConfig()).toBe(false);
  });

  it('should return correct default model', () => {
    const provider = new OpenRouterProvider('test-key');
    expect(provider.getDefaultModel()).toBe('anthropic/claude-3.5-sonnet');
  });

  it('should return supported models', () => {
    const provider = new OpenRouterProvider('test-key');
    const models = provider.getSupportedModels();
    expect(models).toContain('anthropic/claude-3.5-sonnet');
    expect(models).toContain('openai/gpt-4');
  });
});