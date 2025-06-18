import { readFile, writeFile } from 'fs/promises';
import { BaseTool } from './base.js';

export class EditTool extends BaseTool {
  name = 'Edit';
  description = 'Performs exact string replacements in files';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The absolute path to the file to modify',
      required: true,
    },
    old_string: {
      type: 'string',
      description: 'The text to replace',
      required: true,
    },
    new_string: {
      type: 'string',
      description: 'The text to replace it with (must be different from old_string)',
      required: true,
    },
    replace_all: {
      type: 'boolean',
      description: 'Replace all occurrences of old_string (default false)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { file_path, old_string, new_string, replace_all = false } = params;
    
    if (old_string === new_string) {
      return 'Error: old_string and new_string must be different';
    }
    
    try {
      const content = await readFile(file_path, 'utf-8');
      
      if (!content.includes(old_string)) {
        return `Error: String not found in file: "${old_string}"`;
      }
      
      let newContent: string;
      if (replace_all) {
        // Use a simple string replacement for all occurrences
        newContent = content.split(old_string).join(new_string);
      } else {
        // Replace only the first occurrence
        const occurrences = content.split(old_string).length - 1;
        if (occurrences > 1) {
          return `Error: String "${old_string}" appears ${occurrences} times in the file. Use replace_all=true or provide a more specific string.`;
        }
        newContent = content.replace(old_string, new_string);
      }
      
      await writeFile(file_path, newContent, 'utf-8');
      
      const occurrencesReplaced = replace_all ? 
        content.split(old_string).length - 1 : 1;
      
      return `File ${file_path} has been updated. Replaced ${occurrencesReplaced} occurrence(s).`;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `File does not exist: ${file_path}`;
      }
      return `Error editing file: ${error.message}`;
    }
  }
}