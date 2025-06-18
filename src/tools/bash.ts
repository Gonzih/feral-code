import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from './base.js';

const execAsync = promisify(exec);

export class BashTool extends BaseTool {
  name = 'Bash';
  description = 'Execute bash commands in the terminal';
  parameters = {
    command: {
      type: 'string',
      description: 'The bash command to execute',
      required: true,
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds (max 600000)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { command, timeout = 120000 } = params;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: Math.min(timeout, 600000),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      if (stderr) {
        return `Command executed with warnings:\n${stdout}\n\nWarnings/Errors:\n${stderr}`;
      }
      
      return stdout || 'Command executed successfully with no output.';
    } catch (error: any) {
      if (error.code === 'TIMEOUT') {
        return `Command timed out after ${timeout}ms`;
      }
      
      return `Command failed with error: ${error.message}\n${error.stderr || ''}`;
    }
  }
}