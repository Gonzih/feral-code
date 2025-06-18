import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFile, unlink, access } from 'fs/promises';
import { ConfigManager } from '../src/utils/config.js';
import { ProviderFactory } from '../src/providers/index.js';

describe('End-to-End Integration Tests', () => {
  const testEnvFile = join(process.cwd(), '.env.e2e');

  beforeAll(async () => {
    // Create test environment
    await writeFile(testEnvFile, `
FERAL_CODE_PROVIDER=openai
OPENAI_API_KEY=${process.env.OPENAI_API_KEY || 'test-key'}
FERAL_CODE_MODEL=gpt-3.5-turbo
FERAL_CODE_TEMPERATURE=0.7
FERAL_CODE_MAX_TOKENS=1000
FERAL_CODE_VERBOSE=true
`);

    // Ensure dist directory exists and is built
    try {
      await access(join(process.cwd(), 'dist', 'cli.js'));
    } catch {
      throw new Error('Build the project first with "npm run build"');
    }
  });

  afterAll(async () => {
    try {
      await unlink(testEnvFile);
    } catch {
      // File might not exist
    }
  });

  it('should initialize and validate configuration correctly', async () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';

    const configManager = new ConfigManager();
    const config = configManager.getConfig();

    expect(config.provider).toBe('openai');
    expect(config.openaiApiKey).toBe('test-key');
  });

  it('should create provider instances correctly', async () => {
    process.env.FERAL_CODE_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';

    const configManager = new ConfigManager();
    const provider = ProviderFactory.createProvider(configManager);

    expect(provider.name).toBe('openai');
    expect(provider.getDefaultModel()).toBe('gpt-4-turbo-preview');
  });

  it('should handle ollama provider without API key', async () => {
    process.env.FERAL_CODE_PROVIDER = 'ollama';
    delete process.env.OPENAI_API_KEY;

    const configManager = new ConfigManager();
    const validation = configManager.validateConfig();

    expect(validation.valid).toBe(true); // Ollama doesn't need API key
  });

  it('should handle openrouter provider correctly', async () => {
    process.env.FERAL_CODE_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-key';

    const configManager = new ConfigManager();
    const provider = ProviderFactory.createProvider(configManager);

    expect(provider.name).toBe('openrouter');
  });

  it('should build successfully without errors', async () => {
    const result = await runCommand(['npm', 'run', 'build']);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('error');
  });

  it('should pass linting without errors', async () => {
    const result = await runCommand(['npm', 'run', 'lint']);
    expect(result.exitCode).toBe(0);
  });

  it('should install globally without errors', async () => {
    // Test local link installation
    const result = await runCommand(['npm', 'link']);
    expect(result.exitCode).toBe(0);
  });

  it('should run basic CLI commands after global install', async () => {
    // Test that the global command works
    const result = await runCommand(['feral-code', '--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('1.0.0');
  });
});

async function runCommand(command: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command;
    const child = spawn(cmd, args, {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0
      });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({
        stdout,
        stderr,
        exitCode: 1
      });
    }, 30000);
  });
}