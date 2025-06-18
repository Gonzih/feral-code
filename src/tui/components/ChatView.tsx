import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Message } from '../../types/index.js';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  provider: string;
  model: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, provider, model }) => {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.length === 0 ? (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
          <Text color="gray">Welcome to Feral Code!</Text>
          <Text color="gray">Using {provider} ({model})</Text>
          <Text color="gray">Type a message to start chatting...</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {isLoading && (
            <Box marginTop={1}>
              <Spinner type="dots" />
              <Text color="blue"> Assistant is thinking...</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <Box 
      flexDirection="column" 
      marginBottom={1}
      paddingX={1}
      borderStyle={isUser ? "round" : "single"}
      borderColor={isUser ? "cyan" : "green"}
    >
      <Box>
        <Text bold color={isUser ? "cyan" : "green"}>
          {isUser ? "👤 You" : "🤖 Assistant"}
        </Text>
      </Box>
      <Box marginTop={0}>
        <Text>{message.content}</Text>
      </Box>
    </Box>
  );
};