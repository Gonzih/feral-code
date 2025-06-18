import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Session, SessionManager } from '../../utils/session.js';

interface SessionListProps {
  sessionManager: SessionManager;
  onSelectSession: (session: Session) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ sessionManager, onSelectSession }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      const sessionList = await sessionManager.listSessions();
      setSessions(sessionList);
      setIsLoading(false);
    };

    loadSessions();
  }, [sessionManager]);

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < sessions.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return && sessions[selectedIndex]) {
      onSelectSession(sessions[selectedIndex]);
    }
  });

  if (isLoading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>📚 Sessions</Text>
        <Text color="gray">Loading sessions...</Text>
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>📚 Sessions</Text>
        <Text color="gray">No sessions found.</Text>
        <Text color="gray">Start a conversation to create your first session!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} width="50%">
      <Text color="cyan" bold>📚 Sessions</Text>
      <Text color="gray" dimColor>Use ↑/↓ to navigate, Enter to select</Text>
      
      <Box flexDirection="column" marginTop={1}>
        {sessions.map((session, index) => (
          <SessionItem
            key={session.id}
            session={session}
            isSelected={index === selectedIndex}
          />
        ))}
      </Box>
    </Box>
  );
};

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, isSelected }) => {
  const messageCount = session.messages.length;
  const lastMessage = session.messages[session.messages.length - 1];
  
  return (
    <Box
      borderStyle={isSelected ? "round" : undefined}
      borderColor={isSelected ? "cyan" : undefined}
      paddingX={1}
      marginBottom={1}
    >
      <Box flexDirection="column" width="100%">
        <Box>
          <Text bold color={isSelected ? "cyan" : "white"}>
            {session.title}
          </Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray" dimColor>
            {messageCount} messages • {session.provider}
          </Text>
          <Text color="gray" dimColor>
            {session.updated.toLocaleDateString()}
          </Text>
        </Box>
        {lastMessage && (
          <Box marginTop={0}>
            <Text color="gray" dimColor>
              {lastMessage.content.substring(0, 60)}
              {lastMessage.content.length > 60 ? '...' : ''}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};