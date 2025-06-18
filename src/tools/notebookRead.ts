import { readFile } from 'fs/promises';
import { BaseTool } from './base.js';

interface NotebookCell {
  id: string;
  cell_type: 'code' | 'markdown';
  source: string[];
  outputs?: any[];
  execution_count?: number | null;
}

interface NotebookData {
  cells: NotebookCell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

export class NotebookReadTool extends BaseTool {
  name = 'NotebookRead';
  description = 'Reads a Jupyter notebook (.ipynb file) and returns all of the cells with their outputs. Interactive documents combining code, text, and visualizations.';
  parameters = {
    notebook_path: {
      type: 'string',
      description: 'The absolute path to the Jupyter notebook file to read',
      required: true,
    },
    cell_id: {
      type: 'string',
      description: 'The ID of a specific cell to read. If not provided, all cells will be read.',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { notebook_path, cell_id } = params;
    
    if (!notebook_path.endsWith('.ipynb')) {
      return 'Error: File must have .ipynb extension';
    }
    
    try {
      const content = await readFile(notebook_path, 'utf-8');
      const notebook: NotebookData = JSON.parse(content);
      
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        return 'Error: Invalid notebook format - no cells found';
      }
      
      const result = [`Jupyter Notebook: ${notebook_path}`, ''];
      
      // If specific cell requested
      if (cell_id) {
        const cell = notebook.cells.find(c => c.id === cell_id);
        if (!cell) {
          return `Error: Cell with ID "${cell_id}" not found`;
        }
        
        result.push(this.formatCell(cell, notebook.cells.indexOf(cell)));
        return result.join('\n');
      }
      
      // Return all cells
      notebook.cells.forEach((cell, index) => {
        result.push(this.formatCell(cell, index));
        result.push(''); // Separator between cells
      });
      
      result.push(`Total cells: ${notebook.cells.length}`);
      result.push(`Notebook format: ${notebook.nbformat}.${notebook.nbformat_minor}`);
      
      return result.join('\n');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `Error: Notebook file not found: ${notebook_path}`;
      }
      if (error instanceof SyntaxError) {
        return 'Error: Invalid JSON in notebook file';
      }
      return `Error reading notebook: ${error.message}`;
    }
  }
  
  private formatCell(cell: NotebookCell, index: number): string {
    const result = [];
    
    // Cell header
    const cellType = cell.cell_type.toUpperCase();
    const execution = cell.execution_count ? ` [${cell.execution_count}]` : '';
    result.push(`## Cell ${index + 1} (${cellType}${execution}) - ID: ${cell.id || 'unknown'}`);
    
    // Source code/content
    if (cell.source && cell.source.length > 0) {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      if (cell.cell_type === 'code') {
        result.push('```python');
        result.push(source.trim());
        result.push('```');
      } else {
        result.push(source.trim());
      }
    } else {
      result.push('(empty cell)');
    }
    
    // Outputs for code cells
    if (cell.cell_type === 'code' && cell.outputs && cell.outputs.length > 0) {
      result.push('');
      result.push('**Output:**');
      cell.outputs.forEach((output, outputIndex) => {
        if (output.output_type === 'stream') {
          result.push(`Stream (${output.name}):`);
          result.push('```');
          result.push((output.text || []).join('').trim());
          result.push('```');
        } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
          result.push(`Result:`);
          if (output.data) {
            if (output.data['text/plain']) {
              result.push('```');
              result.push((output.data['text/plain'] || []).join('').trim());
              result.push('```');
            }
            if (output.data['text/html']) {
              result.push('HTML output (truncated)');
            }
            if (output.data['image/png'] || output.data['image/jpeg']) {
              result.push('Image output (base64 data available)');
            }
          }
        } else if (output.output_type === 'error') {
          result.push(`Error: ${output.ename}`);
          result.push('```');
          result.push(output.evalue || '');
          if (output.traceback) {
            result.push((output.traceback || []).join('\n'));
          }
          result.push('```');
        }
      });
    }
    
    return result.join('\n');
  }
}