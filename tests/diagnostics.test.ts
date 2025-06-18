import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DiagnosticsManager } from '../src/utils/diagnostics.js';
import { ErrorHandler, OpenCodeError } from '../src/utils/errorHandler.js';
import { ToolSafetyManager } from '../src/utils/toolSafety.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('DiagnosticsManager', () => {
  let diagnostics: DiagnosticsManager;
  let diagnosticsPath: string;

  beforeEach(async () => {
    // Create unique test instance to avoid shared state
    const testId = Math.random().toString(36).substring(7);
    diagnosticsPath = join(homedir(), '.feral-code', `diagnostics-test-${testId}.json`);
    diagnostics = new (class extends DiagnosticsManager {
      constructor() {
        super();
        (this as any).diagnosticPath = diagnosticsPath;
      }
    })();
    
    // Clear diagnostics before each test
    await diagnostics.clearDiagnostics();
  });

  afterEach(async () => {
    try {
      unlinkSync(diagnosticsPath);
    } catch (error) {
      // File might not exist
    }
  });

  it('should log different types of events', async () => {
    await diagnostics.info('tool', 'Test info message');
    await diagnostics.warn('provider', 'Test warning message');
    await diagnostics.error('system', 'Test error message');
    await diagnostics.debug('session', 'Test debug message');

    const events = await diagnostics.getDiagnostics();
    expect(events).toHaveLength(4);
    
    const levels = events.map(e => e.level);
    expect(levels).toContain('info');
    expect(levels).toContain('warn');
    expect(levels).toContain('error');
    expect(levels).toContain('debug');
  });

  it('should filter diagnostics by level', async () => {
    await diagnostics.info('tool', 'Info message');
    await diagnostics.error('tool', 'Error message');
    await diagnostics.warn('tool', 'Warning message');

    const errors = await diagnostics.getDiagnostics({ level: 'error' });
    expect(errors).toHaveLength(1);
    expect(errors[0].level).toBe('error');
    expect(errors[0].message).toBe('Error message');
  });

  it('should filter diagnostics by category', async () => {
    await diagnostics.info('tool', 'Tool message');
    await diagnostics.info('provider', 'Provider message');
    await diagnostics.info('system', 'System message');

    const toolEvents = await diagnostics.getDiagnostics({ category: 'tool' });
    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].category).toBe('tool');
    expect(toolEvents[0].message).toBe('Tool message');
  });

  it('should limit diagnostics results', async () => {
    for (let i = 0; i < 10; i++) {
      await diagnostics.info('tool', `Message ${i}`);
    }

    const limited = await diagnostics.getDiagnostics({ limit: 5 });
    expect(limited).toHaveLength(5);
  });

  it('should get system information', async () => {
    const systemInfo = await diagnostics.getSystemInfo();
    
    expect(systemInfo).toHaveProperty('platform');
    expect(systemInfo).toHaveProperty('nodeVersion');
    expect(systemInfo).toHaveProperty('memory');
    expect(systemInfo).toHaveProperty('uptime');
    expect(systemInfo).toHaveProperty('env');
    expect(systemInfo.env).toHaveProperty('hasOpenAIKey');
    expect(systemInfo.env).toHaveProperty('hasOpenRouterKey');
  });

  it('should clear diagnostics', async () => {
    await diagnostics.info('tool', 'Test message');
    
    let events = await diagnostics.getDiagnostics();
    expect(events).toHaveLength(1);

    await diagnostics.clearDiagnostics();
    
    events = await diagnostics.getDiagnostics();
    expect(events).toHaveLength(0);
  });
});

describe('ErrorHandler', () => {
  it('should handle OpenCodeError correctly', async () => {
    const error = new OpenCodeError('Test error', 'TEST_ERROR', 'tool', { test: true });
    const result = await ErrorHandler.handleError(error, {
      operation: 'test operation',
      category: 'tool',
    });

    expect(result).toContain('Error (TEST_ERROR): Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.category).toBe('tool');
    expect(error.context).toEqual({ test: true });
  });

  it('should categorize common errors', async () => {
    const fileNotFoundError = new Error('ENOENT: no such file or directory');
    const result = await ErrorHandler.handleError(fileNotFoundError, {
      operation: 'file operation',
      category: 'tool',
    });

    expect(result).toContain('Error (FILE_NOT_FOUND): File or directory not found');
  });

  it('should validate required parameters', () => {
    expect(() => {
      ErrorHandler.validateRequired({ a: 1 }, ['a', 'b']);
    }).toThrow('Missing required parameters: b');

    expect(() => {
      ErrorHandler.validateRequired({ a: 1, b: 2 }, ['a', 'b']);
    }).not.toThrow();
  });

  it('should validate enum values', () => {
    expect(() => {
      ErrorHandler.validateEnum('invalid', 'status', ['pending', 'completed']);
    }).toThrow('status must be one of: pending, completed');

    expect(() => {
      ErrorHandler.validateEnum('pending', 'status', ['pending', 'completed']);
    }).not.toThrow();
  });

  it('should validate string length', () => {
    expect(() => {
      ErrorHandler.validateStringLength('ab', 'text', 3, 10);
    }).toThrow('text must be at least 3 characters long');

    expect(() => {
      ErrorHandler.validateStringLength('a'.repeat(15), 'text', 3, 10);
    }).toThrow('text must be at most 10 characters long');

    expect(() => {
      ErrorHandler.validateStringLength('hello', 'text', 3, 10);
    }).not.toThrow();
  });

  it('should validate numbers', () => {
    expect(() => {
      ErrorHandler.validateNumber('not a number', 'count');
    }).toThrow('count must be a valid number');

    expect(() => {
      ErrorHandler.validateNumber(5, 'count', 10, 20);
    }).toThrow('count must be at least 10');

    expect(() => {
      ErrorHandler.validateNumber(25, 'count', 10, 20);
    }).toThrow('count must be at most 20');

    expect(() => {
      ErrorHandler.validateNumber(15, 'count', 10, 20);
    }).not.toThrow();
  });
});

describe('ToolSafetyManager', () => {
  let safety: ToolSafetyManager;

  beforeEach(() => {
    safety = new ToolSafetyManager();
  });

  it('should identify read-only tools', () => {
    expect(safety.isReadOnlyTool('Read')).toBe(true);
    expect(safety.isReadOnlyTool('LS')).toBe(true);
    expect(safety.isReadOnlyTool('Grep')).toBe(true);
    expect(safety.isReadOnlyTool('Write')).toBe(false);
    expect(safety.isReadOnlyTool('Edit')).toBe(false);
  });

  it('should detect path traversal attempts', async () => {
    const result = await safety.validateTool('Read', {
      file_path: '../../../etc/passwd'
    });

    expect(result.safe).toBe(false);
    expect(result.errors).toContain('Path traversal detected in file_path: ../../../etc/passwd');
  });

  it('should warn about system directories', async () => {
    const result = await safety.validateTool('Read', {
      file_path: '/etc/hosts'
    });

    expect(result.safe).toBe(true);
    expect(result.warnings).toContain('Accessing system directory in file_path: /etc/hosts');
  });

  it('should detect dangerous file extensions for write operations', async () => {
    const result = await safety.validateTool('Write', {
      file_path: '/tmp/malware.exe',
      content: 'test'
    });

    expect(result.safe).toBe(false);
    expect(result.errors.some(e => e.includes('potentially dangerous file type'))).toBe(true);
  });

  it('should enforce read-only tool restrictions', async () => {
    const result = await safety.validateTool('Read', {
      file_path: '/tmp/test.txt',
      new_content: 'This should not be allowed'
    });

    expect(result.safe).toBe(false);
    expect(result.errors).toContain('Read-only tool Read attempting to modify content');
  });

  it('should detect dangerous bash commands', async () => {
    const result = await safety.validateTool('Bash', {
      command: 'rm -rf /'
    });

    expect(result.safe).toBe(false);
    expect(result.errors.some(e => e.includes('Potentially dangerous command pattern detected'))).toBe(true);
  });

  it('should warn about suspicious bash commands', async () => {
    const result = await safety.validateTool('Bash', {
      command: 'sudo apt install something'
    });

    expect(result.safe).toBe(true);
    expect(result.warnings.some(w => w.includes('Suspicious command detected: sudo'))).toBe(true);
  });

  it('should track concurrent executions', async () => {
    const cleanup1 = await safety.trackExecution('TestTool');
    const cleanup2 = await safety.trackExecution('TestTool');
    const cleanup3 = await safety.trackExecution('TestTool');

    // Fourth execution should be blocked
    const result = await safety.validateTool('TestTool', {});
    expect(result.safe).toBe(false);
    expect(result.errors.some(e => e.includes('Too many concurrent executions'))).toBe(true);

    // Clean up
    cleanup1();
    cleanup2();
    cleanup3();
  });
});