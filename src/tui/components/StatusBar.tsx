import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface StatusBarProps {
  mode: string;
  provider: string;
  model: string;
  isLoading: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ mode, provider, model, isLoading }) => {
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="cyan">Mode: {mode.toUpperCase()}</Text>
        <Text color="gray"> | </Text>
        <Text color="green">{provider}</Text>
        <Text color="gray"> | </Text>
        <Text color="yellow">{model}</Text>
      </Box>
      
      <Box>
        {isLoading && (
          <React.Fragment>
            <Spinner type="dots" />
            <Text color="blue"> Thinking...</Text>
          </React.Fragment>
        )}
        <Text color="gray" dimColor>
          Ctrl+H:Help | Ctrl+S:Sessions | Ctrl+R:Config | Ctrl+C:Exit
        </Text>
      </Box>
    </Box>
  );
};