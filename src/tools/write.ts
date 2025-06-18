import { writeFile } from 'fs/promises';
import { BaseTool } from './base.js';

export class WriteTool extends BaseTool {
  name = 'Write';
  description = 'Write content to a file';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The absolute path to the file to write',
      required: true,
    },
    content: {
      type: 'string',
      description: 'The content to write to the file',
      required: true,
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { file_path, content } = params;
    
    try {
      await writeFile(file_path, content, 'utf-8');
      return `File written successfully: ${file_path}`;
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  }
}