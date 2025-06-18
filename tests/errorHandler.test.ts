import { describe, it, expect } from 'vitest';
import { ErrorHandler, OpenCodeError } from '../src/utils/errorHandler.js';

describe('ErrorHandler', () => {
  describe('OpenCodeError', () => {
    it('should create error with proper properties', () => {
      const error = new OpenCodeError('Test message', 'TEST_CODE', 'tool', { extra: 'data' });
      
      expect(error.name).toBe('OpenCodeError');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.category).toBe('tool');
      expect(error.context).toEqual({ extra: 'data' });
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('handleError', () => {
    it('should handle OpenCodeError', async () => {
      const openCodeError = new OpenCodeError('Custom error', 'CUSTOM_CODE', 'tool');
      const result = await ErrorHandler.handleError(openCodeError, {
        operation: 'test operation',
        category: 'tool'
      });
      
      expect(result).toContain('CUSTOM_CODE');
      expect(result).toContain('Custom error');
    });

    it('should handle AbortError', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      
      const result = await ErrorHandler.handleError(abortError, {
        operation: 'test operation',
        category: 'tool'
      });
      
      expect(result).toContain('TIMEOUT');
      expect(result).toContain('Operation timed out');
    });

    it('should handle ENOENT error', async () => {
      const enoentError = new Error('ENOENT: no such file or directory');
      
      const result = await ErrorHandler.handleError(enoentError, {
        operation: 'file operation',
        category: 'tool'
      });
      
      expect(result).toContain('FILE_NOT_FOUND');
      expect(result).toContain('File or directory not found');
    });

    it('should handle EACCES error', async () => {
      const eaccesError = new Error('EACCES: permission denied');
      
      const result = await ErrorHandler.handleError(eaccesError, {
        operation: 'file operation',
        category: 'tool'
      });
      
      expect(result).toContain('PERMISSION_DENIED');
      expect(result).toContain('Permission denied');
    });

    it('should handle EMFILE error', async () => {
      const emfileError = new Error('EMFILE: too many open files');
      
      const result = await ErrorHandler.handleError(emfileError, {
        operation: 'file operation',
        category: 'tool'
      });
      
      expect(result).toContain('TOO_MANY_FILES');
      expect(result).toContain('Too many open files');
    });

    it('should handle ENOTDIR error', async () => {
      const enotdirError = new Error('ENOTDIR: not a directory');
      
      const result = await ErrorHandler.handleError(enotdirError, {
        operation: 'directory operation',
        category: 'tool'
      });
      
      expect(result).toContain('NOT_DIRECTORY');
      expect(result).toContain('Not a directory');
    });

    it('should handle EISDIR error', async () => {
      const eisdirError = new Error('EISDIR: illegal operation on a directory');
      
      const result = await ErrorHandler.handleError(eisdirError, {
        operation: 'file operation',
        category: 'tool'
      });
      
      expect(result).toContain('IS_DIRECTORY');
      expect(result).toContain('Is a directory');
    });

    it('should handle network error', async () => {
      const networkError = new Error('network connection failed');
      
      const result = await ErrorHandler.handleError(networkError, {
        operation: 'network operation',
        category: 'provider'
      });
      
      expect(result).toContain('NETWORK_ERROR');
      expect(result).toContain('Network connection failed');
    });

    it('should handle JSON error', async () => {
      const jsonError = new Error('Unexpected token in JSON');
      
      const result = await ErrorHandler.handleError(jsonError, {
        operation: 'parse operation',
        category: 'provider'
      });
      
      expect(result).toContain('INVALID_JSON');
      expect(result).toContain('Invalid JSON format');
    });

    it('should handle unknown error', async () => {
      const unknownError = new Error('Some unknown error');
      
      const result = await ErrorHandler.handleError(unknownError, {
        operation: 'unknown operation',
        category: 'system'
      });
      
      expect(result).toContain('UNKNOWN_ERROR');
      expect(result).toContain('Some unknown error');
    });
  });

  describe('convenience methods', () => {
    it('should handle tool error', async () => {
      const error = new Error('Tool execution failed');
      const result = await ErrorHandler.handleToolError('TestTool', error, { param: 'value' });
      
      expect(result).toContain('UNKNOWN_ERROR');
      expect(result).toContain('Tool execution failed');
    });

    it('should handle provider error', async () => {
      const error = new Error('Provider failed');
      const result = await ErrorHandler.handleProviderError('TestProvider', error, { config: 'test' });
      
      expect(result).toContain('UNKNOWN_ERROR');
      expect(result).toContain('Provider failed');
    });

    it('should handle session error', async () => {
      const error = new Error('Session failed');
      const result = await ErrorHandler.handleSessionError('save', error, 'session-123');
      
      expect(result).toContain('UNKNOWN_ERROR');
      expect(result).toContain('Session failed');
    });

    it('should handle system error', async () => {
      const error = new Error('System failed');
      const result = await ErrorHandler.handleSystemError('startup', error, { system: 'test' });
      
      expect(result).toContain('UNKNOWN_ERROR');
      expect(result).toContain('System failed');
    });
  });

  describe('validation helpers', () => {
    it('should validate required parameters', () => {
      const params = { name: 'test', value: 123 };
      
      expect(() => {
        ErrorHandler.validateRequired(params, ['name', 'value']);
      }).not.toThrow();
      
      expect(() => {
        ErrorHandler.validateRequired(params, ['name', 'missing']);
      }).toThrow('Missing required parameters');
    });

    it('should validate file extension', () => {
      expect(() => {
        ErrorHandler.validateFileExtension('test.js', ['js', 'ts']);
      }).not.toThrow();
      
      expect(() => {
        ErrorHandler.validateFileExtension('test.txt', ['js', 'ts']);
      }).toThrow('Invalid file extension');
    });

    it('should validate string length', () => {
      expect(() => {
        ErrorHandler.validateStringLength('hello', 'test', 3, 10);
      }).not.toThrow();
      
      expect(() => {
        ErrorHandler.validateStringLength('hi', 'test', 3, 10);
      }).toThrow('must be at least');
      
      expect(() => {
        ErrorHandler.validateStringLength('this is too long', 'test', 3, 10);
      }).toThrow('must be at most');
    });

    it('should validate enum values', () => {
      expect(() => {
        ErrorHandler.validateEnum('option1', 'test', ['option1', 'option2']);
      }).not.toThrow();
      
      expect(() => {
        ErrorHandler.validateEnum('invalid', 'test', ['option1', 'option2']);
      }).toThrow('must be one of');
    });

    it('should validate numbers', () => {
      expect(() => {
        ErrorHandler.validateNumber(5, 'test', 1, 10);
      }).not.toThrow();
      
      expect(() => {
        ErrorHandler.validateNumber('not a number', 'test');
      }).toThrow('must be a valid number');
      
      expect(() => {
        ErrorHandler.validateNumber(0, 'test', 1, 10);
      }).toThrow('must be at least');
      
      expect(() => {
        ErrorHandler.validateNumber(15, 'test', 1, 10);
      }).toThrow('must be at most');
    });
  });
});