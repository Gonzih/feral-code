import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { EditTool, MultiEditTool, GlobTool, GrepTool, LSTool } from '../src/tools/index.js';

const testDir = '/tmp/feral-code-test';

describe('Advanced Tools', () => {
  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('EditTool', () => {
    it('should edit files with exact string replacement', async () => {
      const editTool = new EditTool();
      const filePath = join(testDir, 'test.txt');
      await writeFile(filePath, 'Hello world\nThis is a test\nGoodbye world');

      const result = await editTool.execute({
        file_path: filePath,
        old_string: 'Hello world',
        new_string: 'Hello universe'
      });

      expect(result).toContain('has been updated');
    });

    it('should replace all occurrences when replace_all is true', async () => {
      const editTool = new EditTool();
      const filePath = join(testDir, 'test.txt');
      await writeFile(filePath, 'test test test');

      const result = await editTool.execute({
        file_path: filePath,
        old_string: 'test',
        new_string: 'demo',
        replace_all: true
      });

      expect(result).toContain('Replaced 3 occurrence(s)');
    });

    it('should handle non-existent files', async () => {
      const editTool = new EditTool();
      
      const result = await editTool.execute({
        file_path: '/nonexistent/file.txt',
        old_string: 'old',
        new_string: 'new'
      });

      expect(result).toContain('File does not exist');
    });
  });

  describe('MultiEditTool', () => {
    it('should perform multiple edits in sequence', async () => {
      const multiEditTool = new MultiEditTool();
      const filePath = join(testDir, 'multi.txt');
      await writeFile(filePath, 'const foo = "old";\nconst bar = "old2";');

      const result = await multiEditTool.execute({
        file_path: filePath,
        edits: [
          { old_string: '"old"', new_string: '"new"' },
          { old_string: '"old2"', new_string: '"new2"' }
        ]
      });

      expect(result).toContain('updated successfully');
      expect(result).toContain('Edit 1: Replaced 1 occurrence');
      expect(result).toContain('Edit 2: Replaced 1 occurrence');
    });

    it('should validate edit parameters', async () => {
      const multiEditTool = new MultiEditTool();
      
      const result = await multiEditTool.execute({
        file_path: join(testDir, 'test.txt'),
        edits: []
      });

      expect(result).toContain('must be a non-empty array');
    });
  });

  describe('GlobTool', () => {
    it('should find files by pattern', async () => {
      const globTool = new GlobTool();
      
      // Create test files
      await writeFile(join(testDir, 'test.js'), 'console.log("test");');
      await writeFile(join(testDir, 'test.ts'), 'console.log("test");');
      await writeFile(join(testDir, 'readme.md'), '# Test');

      const result = await globTool.execute({
        pattern: '*.js',
        path: testDir
      });

      expect(result).toContain('test.js');
      expect(result).not.toContain('test.ts');
      expect(result).not.toContain('readme.md');
    });

    it('should handle no matches', async () => {
      const globTool = new GlobTool();
      
      const result = await globTool.execute({
        pattern: '*.nonexistent',
        path: testDir
      });

      expect(result).toBe('No files found');
    });
  });

  describe('GrepTool', () => {
    it('should search file contents', async () => {
      const grepTool = new GrepTool();
      
      // Create test files
      await writeFile(join(testDir, 'file1.txt'), 'Hello world\nThis is important\nGoodbye');
      await writeFile(join(testDir, 'file2.txt'), 'Nothing here\nJust text');

      const result = await grepTool.execute({
        pattern: 'important',
        include: '*.txt',
        path: testDir
      });

      expect(result).toContain('file1.txt');
      expect(result).toContain('important');
      expect(result).not.toContain('file2.txt');
    });

    it('should handle no matches', async () => {
      const grepTool = new GrepTool();
      
      await writeFile(join(testDir, 'file.txt'), 'Hello world');

      const result = await grepTool.execute({
        pattern: 'nonexistent',
        path: testDir
      });

      expect(result).toContain('No matches found');
    });
  });

  describe('LSTool', () => {
    it('should list directory contents', async () => {
      const lsTool = new LSTool();
      
      // Create test structure
      await writeFile(join(testDir, 'file1.txt'), 'content');
      await writeFile(join(testDir, 'file2.js'), 'console.log()');
      await mkdir(join(testDir, 'subdir'));

      const result = await lsTool.execute({
        path: testDir
      });

      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.js');
      expect(result).toContain('subdir/');
    });

    it('should handle non-existent directories', async () => {
      const lsTool = new LSTool();
      
      const result = await lsTool.execute({
        path: '/nonexistent/directory'
      });

      expect(result).toContain('Directory does not exist');
    });

    it('should ignore patterns when specified', async () => {
      const lsTool = new LSTool();
      
      await writeFile(join(testDir, 'file.txt'), 'content');
      await writeFile(join(testDir, 'ignore.log'), 'log content');

      const result = await lsTool.execute({
        path: testDir,
        ignore: ['*.log']
      });

      expect(result).toContain('file.txt');
      expect(result).not.toContain('ignore.log');
    });
  });
});