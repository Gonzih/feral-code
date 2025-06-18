import React from 'react';
import { Box, Text } from 'ink';

export const HelpPanel: React.FC = () => {
  return (
    <Box flexDirection="column" padding={2} width="100%">
      <Text bold color="cyan">🆘 Feral Code Help</Text>
      
      <Box flexDirection="column" marginTop={2}>
        <Text bold color="yellow">Keyboard Shortcuts:</Text>
        <Text color="green">Ctrl+H</Text>
        <Text> - Toggle this help panel</Text>
        <Text color="green">Ctrl+S</Text>
        <Text> - View session history</Text>
        <Text color="green">Ctrl+R</Text>
        <Text> - View configuration</Text>
        <Text color="green">Ctrl+C</Text>
        <Text> - Exit application</Text>
        <Text color="green">Esc</Text>
        <Text> - Return to chat mode</Text>
      </Box>

      <Box flexDirection="column" marginTop={2}>
        <Text bold color="yellow">Available Tools:</Text>
        <Text color="green">Bash</Text>
        <Text> - Execute shell commands</Text>
        <Text color="green">Read</Text>
        <Text> - Read file contents</Text>
        <Text color="green">Write</Text>
        <Text> - Write to files</Text>
        <Text color="green">Edit</Text>
        <Text> - Edit files with find/replace</Text>
        <Text color="green">MultiEdit</Text>
        <Text> - Multiple edits in one operation</Text>
        <Text color="green">Glob</Text>
        <Text> - Find files by pattern</Text>
        <Text color="green">Grep</Text>
        <Text> - Search file contents</Text>
        <Text color="green">LS</Text>
        <Text> - List directory contents</Text>
      </Box>

      <Box flexDirection="column" marginTop={2}>
        <Text bold color="yellow">Environment Variables:</Text>
        <Text color="green">FERAL_CODE_PROVIDER</Text>
        <Text> - AI provider (anthropic|openai|openrouter)</Text>
        <Text color="green">ANTHROPIC_API_KEY</Text>
        <Text> - Your Anthropic API key</Text>
        <Text color="green">OPENAI_API_KEY</Text>
        <Text> - Your OpenAI API key</Text>
        <Text color="green">OPENROUTER_API_KEY</Text>
        <Text> - Your OpenRouter API key</Text>
        <Text color="green">FERAL_CODE_MODEL</Text>
        <Text> - Override default model</Text>
        <Text color="green">FERAL_CODE_TEMPERATURE</Text>
        <Text> - Response creativity (0.0-1.0)</Text>
        <Text color="green">FERAL_CODE_MAX_TOKENS</Text>
        <Text> - Maximum response length</Text>
      </Box>

      <Box flexDirection="column" marginTop={2}>
        <Text bold color="yellow">Usage Examples:</Text>
        <Text color="gray">"Create a new React component called Button"</Text>
        <Text color="gray">"Fix the TypeScript errors in this project"</Text>
        <Text color="gray">"Explain what this function does"</Text>
        <Text color="gray">"Run the tests and show me the results"</Text>
        <Text color="gray">"Refactor this code to use modern JavaScript"</Text>
      </Box>

      <Box marginTop={2}>
        <Text color="gray" dimColor>
          Feral Code is an open-source AI coding assistant supporting multiple providers.
        </Text>
      </Box>
    </Box>
  );
};