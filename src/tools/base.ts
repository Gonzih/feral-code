import { diagnostics } from '../utils/diagnostics.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { toolSafety } from '../utils/toolSafety.js';
import { Config } from '../types/index.js';

export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, ToolParameter>;
  
  protected config?: Config;

  protected abstract _execute(params: Record<string, any>): Promise<string>;

  setConfig(config: Config): void {
    this.config = config;
  }

  async execute(params: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    let cleanup: (() => void) | undefined;

    try {
      // Log tool execution start
      await diagnostics.info('tool', `Starting ${this.name} execution`, { 
        toolName: this.name, 
        parameters: this.sanitizeParams(params) 
      });

      // Validate parameters
      this.validateParameters(params);

      // Run safety checks (unless dangerously skipping permissions)
      if (!this.config?.dangerouslySkipPermissions) {
        const safetyResult = await toolSafety.validateTool(this.name, params);
        
        if (!safetyResult.safe) {
          const errorMsg = `Safety check failed: ${safetyResult.errors.join(', ')}`;
          await diagnostics.error('tool', errorMsg, undefined, { toolName: this.name });
          return `Error: ${errorMsg}`;
        }

        if (safetyResult.warnings.length > 0) {
          await diagnostics.warn('tool', `Safety warnings: ${safetyResult.warnings.join(', ')}`, { 
            toolName: this.name 
          });
        }
      } else {
        await diagnostics.debug('tool', `Skipping safety checks for ${this.name} (dangerously-skip-permissions enabled)`);
      }

      // Track concurrent execution
      cleanup = await toolSafety.trackExecution(this.name);

      // Execute the tool
      const result = await this._execute(params);
      
      // Log successful execution
      const duration = Date.now() - startTime;
      await diagnostics.info('tool', `${this.name} executed successfully`, {
        toolName: this.name,
        duration: `${duration}ms`,
        resultLength: result.length,
      });

      return result;

    } catch (error) {
      // Handle and log errors
      const duration = Date.now() - startTime;
      const errorResult = await ErrorHandler.handleToolError(this.name, error as Error, params);
      
      await diagnostics.error('tool', `${this.name} execution failed`, error as Error, {
        toolName: this.name,
        duration: `${duration}ms`,
        parameters: this.sanitizeParams(params),
      });

      return errorResult;

    } finally {
      if (cleanup) {
        cleanup();
      }
    }
  }

  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }

  protected validateParameters(params: Record<string, any>): void {
    const required = Object.entries(this.parameters)
      .filter(([, def]) => def.required)
      .map(([key]) => key);

    ErrorHandler.validateRequired(params, required);

    for (const [key, definition] of Object.entries(this.parameters)) {
      if (key in params && definition.enum) {
        ErrorHandler.validateEnum(params[key], key, definition.enum);
      }
    }
  }

  private sanitizeParams(params: any): any {
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