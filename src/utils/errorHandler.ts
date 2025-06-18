import { diagnostics } from './diagnostics.js';

export interface ErrorContext {
  operation: string;
  category: 'tool' | 'provider' | 'session' | 'system';
  metadata?: any;
}

export class OpenCodeError extends Error {
  public readonly code: string;
  public readonly category: string;
  public readonly context?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    category: string,
    context?: any
  ) {
    super(message);
    this.name = 'OpenCodeError';
    this.code = code;
    this.category = category;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorHandler {
  static async handleError(error: Error, context: ErrorContext): Promise<string> {
    let errorMessage: string;
    let errorCode: string;

    // Categorize and format the error
    if (error instanceof OpenCodeError) {
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error.name === 'AbortError') {
      errorMessage = 'Operation timed out';
      errorCode = 'TIMEOUT';
    } else if (error.message.includes('ENOENT')) {
      errorMessage = 'File or directory not found';
      errorCode = 'FILE_NOT_FOUND';
    } else if (error.message.includes('EACCES')) {
      errorMessage = 'Permission denied';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
      errorMessage = 'Too many open files';
      errorCode = 'TOO_MANY_FILES';
    } else if (error.message.includes('ENOTDIR')) {
      errorMessage = 'Not a directory';
      errorCode = 'NOT_DIRECTORY';
    } else if (error.message.includes('EISDIR')) {
      errorMessage = 'Is a directory';
      errorCode = 'IS_DIRECTORY';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network connection failed';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid JSON format';
      errorCode = 'INVALID_JSON';
    } else {
      errorMessage = error.message || 'Unknown error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }

    // Log the error
    await diagnostics.error(
      context.category,
      `${context.operation} failed: ${errorMessage}`,
      error,
      {
        code: errorCode,
        operation: context.operation,
        metadata: context.metadata,
      }
    );

    // Return user-friendly error message
    return `Error (${errorCode}): ${errorMessage}`;
  }

  static async handleToolError(toolName: string, error: Error, parameters?: any): Promise<string> {
    return this.handleError(error, {
      operation: `Tool execution: ${toolName}`,
      category: 'tool',
      metadata: { toolName, parameters },
    });
  }

  static async handleProviderError(providerName: string, error: Error, context?: any): Promise<string> {
    return this.handleError(error, {
      operation: `Provider operation: ${providerName}`,
      category: 'provider',
      metadata: { providerName, context },
    });
  }

  static async handleSessionError(operation: string, error: Error, sessionId?: string): Promise<string> {
    return this.handleError(error, {
      operation: `Session ${operation}`,
      category: 'session',
      metadata: { sessionId },
    });
  }

  static async handleSystemError(operation: string, error: Error, context?: any): Promise<string> {
    return this.handleError(error, {
      operation: `System ${operation}`,
      category: 'system',
      metadata: context,
    });
  }

  // Validation helpers
  static validateRequired(params: Record<string, any>, required: string[]): void {
    const missing = required.filter(key => params[key] === undefined || params[key] === null);
    if (missing.length > 0) {
      throw new OpenCodeError(
        `Missing required parameters: ${missing.join(', ')}`,
        'MISSING_PARAMETERS',
        'tool',
        { missing, provided: Object.keys(params) }
      );
    }
  }

  static validateFileExtension(filePath: string, extensions: string[]): void {
    const ext = filePath.toLowerCase().split('.').pop();
    if (!ext || !extensions.includes(ext)) {
      throw new OpenCodeError(
        `Invalid file extension. Expected: ${extensions.join(', ')}`,
        'INVALID_FILE_EXTENSION',
        'tool',
        { filePath, expectedExtensions: extensions }
      );
    }
  }

  static validateStringLength(value: string, field: string, min?: number, max?: number): void {
    if (min && value.length < min) {
      throw new OpenCodeError(
        `${field} must be at least ${min} characters long`,
        'STRING_TOO_SHORT',
        'tool',
        { field, value: value.length, min }
      );
    }
    if (max && value.length > max) {
      throw new OpenCodeError(
        `${field} must be at most ${max} characters long`,
        'STRING_TOO_LONG',
        'tool',
        { field, value: value.length, max }
      );
    }
  }

  static validateEnum(value: any, field: string, validValues: any[]): void {
    if (!validValues.includes(value)) {
      throw new OpenCodeError(
        `${field} must be one of: ${validValues.join(', ')}`,
        'INVALID_ENUM_VALUE',
        'tool',
        { field, value, validValues }
      );
    }
  }

  static validateNumber(value: any, field: string, min?: number, max?: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new OpenCodeError(
        `${field} must be a valid number`,
        'INVALID_NUMBER',
        'tool',
        { field, value }
      );
    }
    if (min !== undefined && value < min) {
      throw new OpenCodeError(
        `${field} must be at least ${min}`,
        'NUMBER_TOO_SMALL',
        'tool',
        { field, value, min }
      );
    }
    if (max !== undefined && value > max) {
      throw new OpenCodeError(
        `${field} must be at most ${max}`,
        'NUMBER_TOO_LARGE',
        'tool',
        { field, value, max }
      );
    }
  }
}