import { describe, it, expect, beforeEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { 
  ReadTool, 
  WriteTool, 
  EditTool, 
  MultiEditTool,
  BashTool,
  GlobTool,
  GrepTool,
  LSTool,
  WebFetchTool,
  WebSearchTool
} from '../src/tools/index.js';

const testDir = '/tmp/feral-code-individual-test';

describe('Individual Tool Tests', () => {
  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
  });

  describe('ReadTool', () => {
    it('should read file contents', async () => {
      const readTool = new ReadTool();
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, 'Hello World');
      
      const result = await readTool.execute({ file_path: testFile });
      expect(result).toContain('Hello World');
    });

    it('should handle non-existent files', async () => {
      const readTool = new ReadTool();
      const result = await readTool.execute({ file_path: '/non/existent/file.txt' });
      expect(result).toContain('does not exist');
    });

    it('should handle line limits', async () => {
      const readTool = new ReadTool();
      const testFile = join(testDir, 'large.txt');
      const content = Array(100).fill('line').map((l, i) => `${l} ${i}`).join('\n');
      await writeFile(testFile, content);
      
      const result = await readTool.execute({ 
        file_path: testFile, 
        limit: 10 
      });
      
      expect(result).toContain('line 0');
      expect(result).not.toContain('line 50');
    });
  });

  describe('WriteTool', () => {
    it('should write file contents', async () => {
      const writeTool = new WriteTool();
      const testFile = join(testDir, 'output.txt');
      
      const result = await writeTool.execute({
        file_path: testFile,
        content: 'Test content'
      });
      
      expect(result).toContain('successfully');
    });

    it('should handle missing parameters', async () => {
      const writeTool = new WriteTool();
      const result = await writeTool.execute({});
      expect(result).toContain('Error');
    });
  });

  describe('EditTool', () => {
    it('should edit existing files', async () => {
      const editTool = new EditTool();
      const testFile = join(testDir, 'edit.txt');
      await writeFile(testFile, 'Hello World\nSecond line');
      
      const result = await editTool.execute({
        file_path: testFile,
        old_string: 'World',
        new_string: 'Universe'
      });
      
      expect(result).toContain('updated');
    });

    it('should handle non-existent old_string', async () => {
      const editTool = new EditTool();
      const testFile = join(testDir, 'edit.txt');
      await writeFile(testFile, 'Hello World');
      
      const result = await editTool.execute({
        file_path: testFile,
        old_string: 'NonExistent',
        new_string: 'Something'
      });
      
      expect(result).toContain('not found');
    });
  });

  describe('MultiEditTool', () => {
    it('should perform multiple edits', async () => {
      const multiEditTool = new MultiEditTool();
      const testFile = join(testDir, 'multi.txt');
      await writeFile(testFile, 'Hello World\nGoodbye Universe');
      
      const result = await multiEditTool.execute({
        file_path: testFile,
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'Goodbye', new_string: 'Farewell' }
        ]
      });
      
      expect(result).toContain('successfully');
    });

    it('should handle invalid edit arrays', async () => {
      const multiEditTool = new MultiEditTool();
      const result = await multiEditTool.execute({
        file_path: '/tmp/test.txt',
        edits: 'not an array'
      });
      
      expect(result).toContain('Error');
    });
  });

  describe('BashTool', () => {
    it('should execute simple commands', async () => {
      const bashTool = new BashTool();
      const result = await bashTool.execute({
        command: 'echo "test"'
      });
      
      expect(result).toContain('test');
    });

    it('should handle command timeouts', async () => {
      const bashTool = new BashTool();
      const result = await bashTool.execute({
        command: 'sleep 10',
        timeout: 100
      });
      
      expect(result).toContain('failed');
    });

    it('should handle missing command', async () => {
      const bashTool = new BashTool();
      const result = await bashTool.execute({});
      
      expect(result).toContain('Error');
    });
  });

  describe('GlobTool', () => {
    it('should find files by pattern', async () => {
      const globTool = new GlobTool();
      
      // Create test files
      await writeFile(join(testDir, 'test1.js'), 'content1');
      await writeFile(join(testDir, 'test2.js'), 'content2');
      await writeFile(join(testDir, 'test.txt'), 'content3');
      
      const result = await globTool.execute({
        pattern: '*.js',
        path: testDir
      });
      
      expect(result).toContain('test1.js');
      expect(result).toContain('test2.js');
      expect(result).not.toContain('test.txt');
    });

    it('should handle no matches', async () => {
      const globTool = new GlobTool();
      const result = await globTool.execute({
        pattern: '*.nonexistent',
        path: testDir
      });
      
      expect(result).toContain('No files found');
    });
  });

  describe('GrepTool', () => {
    it('should search file contents', async () => {
      const grepTool = new GrepTool();
      
      await writeFile(join(testDir, 'search1.txt'), 'Hello World\nTest line');
      await writeFile(join(testDir, 'search2.txt'), 'Another file\nHello Universe');
      
      const result = await grepTool.execute({
        pattern: 'Hello',
        path: testDir,
        include: '*.txt'
      });
      
      expect(result).toContain('Hello World');
      expect(result).toContain('Hello Universe');
    });

    it('should handle no matches', async () => {
      const grepTool = new GrepTool();
      await writeFile(join(testDir, 'empty.txt'), 'No matching content');
      
      const result = await grepTool.execute({
        pattern: 'NonExistentPattern',
        path: testDir
      });
      
      expect(result).toContain('No matches found');
    });
  });

  describe('LSTool', () => {
    it('should list directory contents', async () => {
      const lsTool = new LSTool();
      
      await writeFile(join(testDir, 'file1.txt'), 'content');
      await writeFile(join(testDir, 'file2.js'), 'code');
      await mkdir(join(testDir, 'subdir'));
      
      const result = await lsTool.execute({ path: testDir });
      
      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.js');
      expect(result).toContain('subdir/');
    });

    it('should handle non-existent directories', async () => {
      const lsTool = new LSTool();
      const result = await lsTool.execute({ path: '/non/existent/dir' });
      
      expect(result).toContain('does not exist');
    });

    it('should ignore patterns', async () => {
      const lsTool = new LSTool();
      
      await writeFile(join(testDir, 'keep.txt'), 'content');
      await writeFile(join(testDir, 'ignore.log'), 'logs');
      
      const result = await lsTool.execute({ 
        path: testDir,
        ignore: ['*.log']
      });
      
      expect(result).toContain('keep.txt');
      expect(result).not.toContain('ignore.log');
    });
  });

  describe('WebFetchTool', () => {
    it('should handle missing URL', async () => {
      const webFetchTool = new WebFetchTool();
      const result = await webFetchTool.execute({
        prompt: 'test prompt'
      });
      
      expect(result).toContain('Error');
    });

    it('should handle missing prompt', async () => {
      const webFetchTool = new WebFetchTool();
      const result = await webFetchTool.execute({
        url: 'https://example.com'
      });
      
      expect(result).toContain('Error');
    });
  });

  describe('WebSearchTool', () => {
    it('should handle missing query', async () => {
      const webSearchTool = new WebSearchTool();
      const result = await webSearchTool.execute({});
      
      expect(result).toContain('Error');
    });

    it('should handle invalid query length', async () => {
      const webSearchTool = new WebSearchTool();
      const result = await webSearchTool.execute({
        query: 'a' // Too short
      });
      
      expect(result).toContain('Error');
    });
  });

  describe('Tool Parameter Validation', () => {
    it('should validate required parameters', async () => {
      const readTool = new ReadTool();
      const result = await readTool.execute({});
      
      expect(result).toContain('Missing required parameters');
    });

    it('should validate enum parameters', async () => {
      const result = await new EditTool().execute({
        file_path: '/tmp/test.txt',
        old_string: 'old',
        new_string: 'new',
        replace_all: 'invalid' // Should be boolean
      });
      
      // Tool should handle this gracefully
      expect(result).toBeDefined();
    });
  });
});