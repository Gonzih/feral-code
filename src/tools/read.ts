import { readFile } from 'fs/promises';
import { BaseTool } from './base.js';

export class ReadTool extends BaseTool {
  name = 'Read';
  description = 'Read the contents of a file';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The absolute path to the file to read',
      required: true,
    },
    offset: {
      type: 'number',
      description: 'The line number to start reading from',
    },
    limit: {
      type: 'number',
      description: 'The number of lines to read',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { file_path, offset, limit } = params;
    
    try {
      const content = await readFile(file_path, 'utf-8');
      const lines = content.split('\n');
      
      let result = lines;
      
      if (offset !== undefined) {
        result = result.slice(offset - 1);
      }
      
      if (limit !== undefined) {
        result = result.slice(0, limit);
      }
      
      // Add line numbers like cat -n
      const numberedLines = result.map((line, index) => {
        const lineNumber = (offset || 1) + index;
        return `${lineNumber.toString().padStart(6)}→${line}`;
      });
      
      return numberedLines.join('\n');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `File does not exist: ${file_path}`;
      }
      return `Error reading file: ${error.message}`;
    }
  }
}