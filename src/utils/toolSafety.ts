import { readFile, stat } from 'fs/promises';
import { basename, extname, resolve } from 'path';
import { diagnostics } from './diagnostics.js';

export interface SafetyCheck {
  name: string;
  description: string;
  check: (toolName: string, params: any) => Promise<SafetyResult>;
}

export interface SafetyResult {
  safe: boolean;
  warnings: string[];
  errors: string[];
  metadata?: any;
}

export class ToolSafetyManager {
  private checks: SafetyCheck[] = [];
  private readOnlyTools: Set<string> = new Set(['Read', 'LS', 'Glob', 'Grep', 'TodoRead', 'NotebookRead', 'WebFetch', 'WebSearch']);
  private concurrentExecutions: Map<string, number> = new Map();
  private maxConcurrentExecutions = 3;

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks(): void {
    // File path validation
    this.addCheck({
      name: 'path-traversal',
      description: 'Prevents directory traversal attacks',
      check: async (toolName: string, params: any) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        const pathParams = this.extractPathParameters(params);
        
        for (const [paramName, path] of pathParams) {
          if (typeof path !== 'string') continue;
          
          // Check for path traversal attempts
          if (path.includes('../') || path.includes('..\\')) {
            errors.push(`Path traversal detected in ${paramName}: ${path}`);
          }
          
          // Check for suspicious paths
          if (path.includes('/etc/') || path.includes('/root/') || path.includes('C:\\Windows\\System32')) {
            warnings.push(`Accessing system directory in ${paramName}: ${path}`);
          }
          
          // Check for hidden files (may be intentional)
          if (basename(path).startsWith('.') && !path.includes('.feral-code')) {
            warnings.push(`Accessing hidden file/directory in ${paramName}: ${path}`);
          }
        }

        return {
          safe: errors.length === 0,
          warnings,
          errors,
        };
      },
    });

    // File extension validation
    this.addCheck({
      name: 'file-extension',
      description: 'Validates file extensions for safety',
      check: async (toolName: string, params: any) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        const pathParams = this.extractPathParameters(params);
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar'];
        const systemFiles = ['.dll', '.sys', '.ini'];

        for (const [paramName, path] of pathParams) {
          if (typeof path !== 'string') continue;
          
          const ext = extname(path).toLowerCase();
          
          if (dangerousExtensions.includes(ext)) {
            if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit') {
              errors.push(`Writing to potentially dangerous file type in ${paramName}: ${ext}`);
            } else {
              warnings.push(`Accessing potentially dangerous file type in ${paramName}: ${ext}`);
            }
          }
          
          if (systemFiles.includes(ext)) {
            warnings.push(`Accessing system file in ${paramName}: ${ext}`);
          }
        }

        return {
          safe: errors.length === 0,
          warnings,
          errors,
        };
      },
    });

    // Read-only tool validation
    this.addCheck({
      name: 'read-only-enforcement',
      description: 'Ensures read-only tools do not modify files',
      check: async (toolName: string, params: any) => {
        const errors: string[] = [];

        if (this.readOnlyTools.has(toolName)) {
          // These tools should never modify files
          if (params.new_content || params.content || params.new_string || params.edits) {
            errors.push(`Read-only tool ${toolName} attempting to modify content`);
          }
        }

        return {
          safe: errors.length === 0,
          warnings: [],
          errors,
        };
      },
    });

    // Command injection prevention
    this.addCheck({
      name: 'command-injection',
      description: 'Prevents command injection in bash commands',
      check: async (toolName: string, params: any) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        if (toolName === 'Bash' && params.command) {
          const command = params.command as string;
          
          // Check for dangerous patterns
          const dangerousPatterns = [
            /rm\s+-rf\s+\/\s*$/i, // rm -rf /
            /rm\s+-rf\s+\/\*\s*$/i, // rm -rf /*
            /;\s*rm\s+-rf/i,
            /&&\s*rm\s+-rf/i,
            /\|\s*rm\s+-rf/i,
            /;\s*sudo\s+/i,
            /&&\s*sudo\s+/i,
            /\|\s*sudo\s+/i,
            /curl.*\|\s*sh/i,
            /wget.*\|\s*sh/i,
            /curl.*\|\s*bash/i,
            /wget.*\|\s*bash/i,
          ];

          for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
              errors.push(`Potentially dangerous command pattern detected: ${command}`);
              break;
            }
          }

          // Check for suspicious commands
          const suspiciousCommands = ['rm -rf', 'sudo', 'chmod 777', 'mkfs', 'dd if=', 'format'];
          for (const suspicious of suspiciousCommands) {
            if (command.includes(suspicious)) {
              warnings.push(`Suspicious command detected: ${suspicious}`);
            }
          }
        }

        return {
          safe: errors.length === 0,
          warnings,
          errors,
        };
      },
    });

    // File size validation
    this.addCheck({
      name: 'file-size',
      description: 'Prevents operations on excessively large files',
      check: async (toolName: string, params: any) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        const pathParams = this.extractPathParameters(params);
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const warnFileSize = 1024 * 1024; // 1MB

        for (const [paramName, path] of pathParams) {
          if (typeof path !== 'string') continue;
          
          try {
            const resolvedPath = resolve(path);
            const stats = await stat(resolvedPath);
            
            if (stats.isFile()) {
              if (stats.size > maxFileSize) {
                errors.push(`File too large in ${paramName}: ${Math.round(stats.size / 1024 / 1024)}MB`);
              } else if (stats.size > warnFileSize) {
                warnings.push(`Large file in ${paramName}: ${Math.round(stats.size / 1024 / 1024)}MB`);
              }
            }
          } catch (error) {
            // File might not exist yet (for write operations), which is okay
          }
        }

        return {
          safe: errors.length === 0,
          warnings,
          errors,
        };
      },
    });
  }

  addCheck(check: SafetyCheck): void {
    this.checks.push(check);
  }

  async validateTool(toolName: string, params: any): Promise<SafetyResult> {
    const allWarnings: string[] = [];
    const allErrors: string[] = [];

    // Check concurrency limits
    const currentCount = this.concurrentExecutions.get(toolName) || 0;
    if (currentCount >= this.maxConcurrentExecutions) {
      allErrors.push(`Too many concurrent executions of ${toolName} (max: ${this.maxConcurrentExecutions})`);
    }

    // Run all safety checks
    for (const check of this.checks) {
      try {
        const result = await check.check(toolName, params);
        allWarnings.push(...result.warnings);
        allErrors.push(...result.errors);
      } catch (error) {
        await diagnostics.error('system', `Safety check '${check.name}' failed`, error as Error);
        allWarnings.push(`Safety check '${check.name}' failed to execute`);
      }
    }

    // Log safety results
    if (allErrors.length > 0) {
      await diagnostics.error('tool', `Safety validation failed for ${toolName}`, undefined, {
        toolName,
        errors: allErrors,
        warnings: allWarnings,
        params: this.sanitizeParams(params),
      });
    } else if (allWarnings.length > 0) {
      await diagnostics.warn('tool', `Safety warnings for ${toolName}`, {
        toolName,
        warnings: allWarnings,
        params: this.sanitizeParams(params),
      });
    }

    return {
      safe: allErrors.length === 0,
      warnings: allWarnings,
      errors: allErrors,
    };
  }

  async trackExecution(toolName: string): Promise<() => void> {
    const current = this.concurrentExecutions.get(toolName) || 0;
    this.concurrentExecutions.set(toolName, current + 1);

    await diagnostics.debug('tool', `Started execution of ${toolName}`, {
      toolName,
      concurrentCount: current + 1,
    });

    // Return cleanup function
    return () => {
      const newCount = Math.max(0, (this.concurrentExecutions.get(toolName) || 1) - 1);
      this.concurrentExecutions.set(toolName, newCount);
      
      diagnostics.debug('tool', `Finished execution of ${toolName}`, {
        toolName,
        concurrentCount: newCount,
      });
    };
  }

  isReadOnlyTool(toolName: string): boolean {
    return this.readOnlyTools.has(toolName);
  }

  private extractPathParameters(params: any): Array<[string, string]> {
    const pathParams: Array<[string, string]> = [];
    
    // Common path parameter names
    const pathKeys = [
      'file_path', 'path', 'notebook_path', 'directory', 'dir',
      'input_path', 'output_path', 'source', 'destination', 'target'
    ];

    for (const key of pathKeys) {
      if (params[key] && typeof params[key] === 'string') {
        pathParams.push([key, params[key]]);
      }
    }

    return pathParams;
  }

  private sanitizeParams(params: any): any {
    // Remove sensitive information from params for logging
    const sanitized = { ...params };
    
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export const toolSafety = new ToolSafetyManager();