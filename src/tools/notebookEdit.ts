import { readFile, writeFile } from 'fs/promises';
import { BaseTool } from './base.js';

interface NotebookCell {
  id: string;
  cell_type: 'code' | 'markdown';
  source: string[];
  outputs?: any[];
  execution_count?: number | null;
  metadata?: any;
}

interface NotebookData {
  cells: NotebookCell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

export class NotebookEditTool extends BaseTool {
  name = 'NotebookEdit';
  description = 'Completely replaces the contents of a specific cell in a Jupyter notebook (.ipynb file) with new source. Supports insert and delete operations.';
  parameters = {
    notebook_path: {
      type: 'string',
      description: 'The absolute path to the Jupyter notebook file to edit',
      required: true,
    },
    new_source: {
      type: 'string',
      description: 'The new source for the cell',
      required: true,
    },
    cell_id: {
      type: 'string',
      description: 'The ID of the cell to edit. When inserting, new cell will be inserted after this cell, or at beginning if not specified.',
    },
    cell_type: {
      type: 'string',
      description: 'The type of the cell (code or markdown). Required for insert mode, defaults to current type for replace.',
    },
    edit_mode: {
      type: 'string',
      description: 'The type of edit to make: replace (default), insert, or delete',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { notebook_path, new_source, cell_id, cell_type, edit_mode = 'replace' } = params;
    
    if (!notebook_path.endsWith('.ipynb')) {
      return 'Error: File must have .ipynb extension';
    }
    
    if (!['replace', 'insert', 'delete'].includes(edit_mode)) {
      return 'Error: edit_mode must be replace, insert, or delete';
    }
    
    if (cell_type && !['code', 'markdown'].includes(cell_type)) {
      return 'Error: cell_type must be code or markdown';
    }
    
    try {
      const content = await readFile(notebook_path, 'utf-8');
      const notebook: NotebookData = JSON.parse(content);
      
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        return 'Error: Invalid notebook format - no cells found';
      }
      
      if (edit_mode === 'insert') {
        if (!cell_type) {
          return 'Error: cell_type is required for insert mode';
        }
        
        const newCell: NotebookCell = {
          id: this.generateCellId(),
          cell_type: cell_type as 'code' | 'markdown',
          source: this.stringToSourceArray(new_source),
          metadata: {},
        };
        
        if (cell_type === 'code') {
          newCell.execution_count = null;
          newCell.outputs = [];
        }
        
        if (cell_id) {
          const targetIndex = notebook.cells.findIndex(c => c.id === cell_id);
          if (targetIndex === -1) {
            return `Error: Cell with ID "${cell_id}" not found`;
          }
          notebook.cells.splice(targetIndex + 1, 0, newCell);
        } else {
          notebook.cells.unshift(newCell);
        }
        
        await this.saveNotebook(notebook_path, notebook);
        return `Cell inserted successfully. New cell ID: ${newCell.id}`;
        
      } else if (edit_mode === 'delete') {
        if (!cell_id) {
          return 'Error: cell_id is required for delete mode';
        }
        
        const targetIndex = notebook.cells.findIndex(c => c.id === cell_id);
        if (targetIndex === -1) {
          return `Error: Cell with ID "${cell_id}" not found`;
        }
        
        notebook.cells.splice(targetIndex, 1);
        await this.saveNotebook(notebook_path, notebook);
        return `Cell "${cell_id}" deleted successfully`;
        
      } else { // replace mode
        if (!cell_id) {
          return 'Error: cell_id is required for replace mode';
        }
        
        const targetCell = notebook.cells.find(c => c.id === cell_id);
        if (!targetCell) {
          return `Error: Cell with ID "${cell_id}" not found`;
        }
        
        // Update cell type if specified
        if (cell_type && cell_type !== targetCell.cell_type) {
          targetCell.cell_type = cell_type as 'code' | 'markdown';
          
          if (cell_type === 'code') {
            targetCell.execution_count = null;
            targetCell.outputs = [];
          } else {
            delete targetCell.execution_count;
            delete targetCell.outputs;
          }
        }
        
        targetCell.source = this.stringToSourceArray(new_source);
        
        await this.saveNotebook(notebook_path, notebook);
        return `Cell "${cell_id}" updated successfully`;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `Error: Notebook file not found: ${notebook_path}`;
      }
      if (error instanceof SyntaxError) {
        return 'Error: Invalid JSON in notebook file';
      }
      return `Error editing notebook: ${error.message}`;
    }
  }
  
  private stringToSourceArray(source: string): string[] {
    // Convert string to array format used by Jupyter notebooks
    // Each line should end with \n except the last one
    const lines = source.split('\n');
    return lines.map((line, index) => 
      index === lines.length - 1 && line === '' ? line : line + '\n'
    ).filter((line, index) => !(index === lines.length - 1 && line === ''));
  }
  
  private generateCellId(): string {
    // Generate a random cell ID similar to Jupyter's format
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private async saveNotebook(path: string, notebook: NotebookData): Promise<void> {
    const content = JSON.stringify(notebook, null, 2);
    await writeFile(path, content, 'utf-8');
  }
}