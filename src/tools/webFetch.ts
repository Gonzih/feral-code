import fetch from 'node-fetch';
import { BaseTool } from './base.js';

export class WebFetchTool extends BaseTool {
  name = 'WebFetch';
  description = 'Fetches content from a specified URL and processes it using an AI model. Useful for retrieving and analyzing web content.';
  parameters = {
    url: {
      type: 'string',
      description: 'The URL to fetch content from (must be a valid HTTP/HTTPS URL)',
      required: true,
    },
    prompt: {
      type: 'string', 
      description: 'The prompt to run on the fetched content to extract specific information',
      required: true,
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds (default: 30000)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { url, prompt, timeout = 30000 } = params;
    
    // Validate URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'Error: URL must use HTTP or HTTPS protocol';
      }
    } catch (error) {
      return 'Error: Invalid URL format';
    }
    
    try {
      // Fetch the content with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FERAL CODE Web Fetcher 1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return `Error: HTTP ${response.status} ${response.statusText}`;
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/') && !contentType.includes('application/json') && !contentType.includes('application/xml')) {
        return 'Error: Content type not supported. Only text-based content can be fetched.';
      }
      
      const content = await response.text();
      
      if (content.length === 0) {
        return 'Error: No content received from URL';
      }
      
      if (content.length > 100000) {
        return `Content retrieved (${content.length} characters). Content is too large to process directly. Consider using a more specific prompt or fetching a smaller resource.`;
      }
      
      // Convert HTML to markdown-like format for better processing
      const processedContent = this.processHtmlContent(content);
      
      return `Content fetched from ${url}:\n\n${prompt}\n\nContent:\n${processedContent.substring(0, 10000)}${processedContent.length > 10000 ? '...' : ''}`;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return 'Error: Request timed out';
      }
      return `Error fetching content: ${error.message}`;
    }
  }
  
  private processHtmlContent(html: string): string {
    // Basic HTML to text conversion
    return html
      // Remove script and style elements
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Convert common HTML elements to markdown-like format
      .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, text) => '\n' + '#'.repeat(parseInt(level)) + ' ' + text + '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }
}