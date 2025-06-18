import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'child_process';
import { access, readdir, stat } from 'fs/promises';
import { join } from 'path';

describe('Build and Distribution Tests', () => {
  const distPath = join(process.cwd(), 'dist');

  beforeAll(async () => {
    // Ensure the project is built
    await runBuildCommand();
  });

  it('should create dist directory', async () => {
    await expect(access(distPath)).resolves.not.toThrow();
  });

  it('should build all TypeScript files to JavaScript', async () => {
    const files = await readdir(distPath, { recursive: true });
    const jsFiles = files.filter(file => file.toString().endsWith('.js'));
    
    // Should have main files
    expect(jsFiles.some(file => file.toString().includes('cli.js'))).toBe(true);
    expect(jsFiles.some(file => file.toString().includes('index.js'))).toBe(true);
    
    // Should have provider files
    expect(jsFiles.some(file => file.toString().includes('providers'))).toBe(true);
    expect(jsFiles.some(file => file.toString().includes('openai.js'))).toBe(true);
    expect(jsFiles.some(file => file.toString().includes('openrouter.js'))).toBe(true);
    expect(jsFiles.some(file => file.toString().includes('ollama.js'))).toBe(true);
    
    // Should have tool files
    expect(jsFiles.some(file => file.toString().includes('tools'))).toBe(true);
    
    // Should have utils
    expect(jsFiles.some(file => file.toString().includes('utils'))).toBe(true);
    expect(jsFiles.some(file => file.toString().includes('config.js'))).toBe(true);
  });

  it('should generate type declaration files', async () => {
    const files = await readdir(distPath, { recursive: true });
    const dtsFiles = files.filter(file => file.toString().endsWith('.d.ts'));
    
    expect(dtsFiles.length).toBeGreaterThan(0);
    expect(dtsFiles.some(file => file.toString().includes('index.d.ts'))).toBe(true);
  });

  it('should generate source maps', async () => {
    const files = await readdir(distPath, { recursive: true });
    const mapFiles = files.filter(file => file.toString().endsWith('.js.map'));
    
    expect(mapFiles.length).toBeGreaterThan(0);
  });

  it('should have executable CLI file', async () => {
    const cliPath = join(distPath, 'cli.js');
    await expect(access(cliPath)).resolves.not.toThrow();
    
    const stats = await stat(cliPath);
    expect(stats.isFile()).toBe(true);
  });

  it('should build without TypeScript errors', async () => {
    const result = await runCommand(['npm', 'run', 'lint']);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('error TS');
  });

  it('should have correct file sizes (not bloated)', async () => {
    const cliPath = join(distPath, 'cli.js');
    const stats = await stat(cliPath);
    
    // CLI file should be reasonable size (less than 100KB)
    expect(stats.size).toBeLessThan(100 * 1024);
  });

  it('should contain all required exports', async () => {
    // Test that we can import main modules
    const { ConfigManager } = await import('../dist/utils/config.js');
    const { ProviderFactory } = await import('../dist/providers/index.js');
    
    expect(ConfigManager).toBeDefined();
    expect(ProviderFactory).toBeDefined();
    expect(typeof ProviderFactory.createProvider).toBe('function');
  });

  it('should work with Node.js module resolution', async () => {
    // Test that the built files can be loaded by Node.js
    const result = await runCommand(['node', '-e', `
      const { ConfigManager } = require('./dist/utils/config.js');
      const config = new ConfigManager();
      console.log('SUCCESS: Module loaded correctly');
    `]);
    
    expect(result.stdout).toContain('SUCCESS: Module loaded correctly');
    expect(result.exitCode).toBe(0);
  });
});

async function runBuildCommand(): Promise<void> {
  const result = await runCommand(['npm', 'run', 'build']);
  if (result.exitCode !== 0) {
    throw new Error(`Build failed: ${result.stderr}`);
  }
}

async function runCommand(command: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command;
    const child = spawn(cmd, args, {
      stdio: 'pipe',
      shell: process.platform === 'win32'
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