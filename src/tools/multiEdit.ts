import { readFile, writeFile } from 'fs/promises';
import { BaseTool } from './base.js';

interface EditOperation {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export class MultiEditTool extends BaseTool {
  name = 'MultiEdit';
  description = 'Make multiple edits to a single file in one operation';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The absolute path to the file to modify',
      required: true,
    },
    edits: {
      type: 'array',
      description: 'Array of edit operations to perform sequentially',
      required: true,
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { file_path, edits } = params;
    
    if (!Array.isArray(edits) || edits.length === 0) {
      return 'Error: edits must be a non-empty array';
    }
    
    try {
      let content = await readFile(file_path, 'utf-8');
      const results: string[] = [];
      
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i] as EditOperation;
        
        if (!edit.old_string || edit.new_string === undefined) {
          return `Error: Edit ${i + 1} is missing old_string or new_string`;
        }
        
        if (edit.old_string === edit.new_string) {
          return `Error: Edit ${i + 1} has identical old_string and new_string`;
        }
        
        if (!content.includes(edit.old_string)) {
          return `Error: Edit ${i + 1} - String not found: "${edit.old_string}"`;
        }
        
        let newContent: string;
        if (edit.replace_all) {
          newContent = content.split(edit.old_string).join(edit.new_string);
          const occurrences = content.split(edit.old_string).length - 1;
          results.push(`Edit ${i + 1}: Replaced ${occurrences} occurrence(s)`);
        } else {
          const occurrences = content.split(edit.old_string).length - 1;
          if (occurrences > 1) {
            return `Error: Edit ${i + 1} - String "${edit.old_string}" appears ${occurrences} times. Use replace_all=true or provide a more specific string.`;
          }
          newContent = content.replace(edit.old_string, edit.new_string);
          results.push(`Edit ${i + 1}: Replaced 1 occurrence`);
        }
        
        content = newContent;
      }
      
      await writeFile(file_path, content, 'utf-8');
      
      return `File ${file_path} has been updated successfully.\n${results.join('\n')}`;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `File does not exist: ${file_path}`;
      }
      return `Error editing file: ${error.message}`;
    }
  }
}