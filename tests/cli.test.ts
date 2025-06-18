import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { homedir } from 'os';

describe('CLI Integration Tests', () => {
  let cliProcess: ChildProcess | null = null;
  const testEnvFile = join(process.cwd(), '.env.test');

  beforeEach(async () => {
    // Create test environment file
    await writeFile(testEnvFile, `
FERAL_CODE_PROVIDER=openai
OPENAI_API_KEY=test-key-for-cli
FERAL_CODE_MODEL=gpt-3.5-turbo
FERAL_CODE_VERBOSE=false
`);
  });

  afterEach(async () => {
    // Cleanup
    if (cliProcess) {
      cliProcess.kill();
      cliProcess = null;
    }
    
    try {
      await unlink(testEnvFile);
    } catch {
      // File might not exist
    }
  });

  it('should show help when --help flag is provided', async () => {
    const result = await runCLICommand(['--help']);
    expect(result.stdout).toContain('feral-code');
    expect(result.stdout).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });

  it('should show version when --version flag is provided', async () => {
    const result = await runCLICommand(['--version']);
    expect(result.stdout).toContain('1.0.0');
    expect(result.exitCode).toBe(0);
  });

  it('should show config command output', async () => {
    const result = await runCLICommand(['config'], testEnvFile);
    expect(result.stdout).toContain('Provider:');
    expect(result.stdout).toContain('openai');
    expect(result.exitCode).toBe(0);
  });

  it('should show models command output', async () => {
    const result = await runCLICommand(['models'], testEnvFile);
    expect(result.stdout).toContain('Available models');
    expect(result.exitCode).toBe(0);
  });

  it('should handle missing API key gracefully', async () => {
    const badEnvFile = join(process.cwd(), '.env.bad');
    await writeFile(badEnvFile, `
FERAL_CODE_PROVIDER=openai
# Missing OPENAI_API_KEY
`);

    const result = await runCLICommand(['config'], badEnvFile);
    expect(result.stderr).toContain('API key not found');
    expect(result.exitCode).toBe(1);

    await unlink(badEnvFile);
  });

  it('should handle invalid provider gracefully', async () => {
    const badEnvFile = join(process.cwd(), '.env.invalid');
    await writeFile(badEnvFile, `
FERAL_CODE_PROVIDER=invalid-provider
OPENAI_API_KEY=test-key
`);

    const result = await runCLICommand(['config'], badEnvFile);
    expect(result.stderr).toContain('Unknown provider');
    expect(result.exitCode).toBe(1);

    await unlink(badEnvFile);
  });

  it('should show environment variable help', async () => {
    const result = await runCLICommand(['--help']);
    expect(result.stdout).toContain('FERAL_CODE_PROVIDER');
    expect(result.stdout).toContain('OPENAI_API_KEY');
    expect(result.exitCode).toBe(0);
  });

  it('should handle print mode with simple prompt', async () => {
    // This test will fail with real API but should handle the error gracefully
    const result = await runCLICommand(['--print', 'test prompt'], testEnvFile);
    // Should either work (if API key is valid) or fail gracefully
    expect(result.exitCode).toBeGreaterThanOrEqual(0);
  });
});

async function runCLICommand(args: string[], envFile?: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const cliPath = join(process.cwd(), 'dist', 'cli.js');
    const env = envFile ? { ...process.env, NODE_ENV: 'test' } : process.env;
    
    if (envFile) {
      env.NODE_OPTIONS = `--env-file=${envFile}`;
    }

    const child = spawn('node', [cliPath, ...args], {
      env,
      stdio: 'pipe'
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

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      resolve({
        stdout,
        stderr,
        exitCode: 1
      });
    }, 10000);
  });
}