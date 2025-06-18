import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
// Removed gradient and big text for simplicity
import { ChatView } from './components/ChatView.js';
import { SessionList } from './components/SessionList.js';
import { StatusBar } from './components/StatusBar.js';
import { HelpPanel } from './components/HelpPanel.js';
import { Header } from './components/Header.js';
import { ConfigManager } from '../utils/config.js';
import { SessionManager } from '../utils/session.js';
import { ProviderFactory } from '../providers/index.js';
import { AIProvider, Message } from '../types/index.js';
import { costTracker } from '../utils/costTracker.js';

type AppMode = 'chat' | 'sessions' | 'help' | 'config';

interface AppProps {
  initialPrompt?: string;
  configManager: ConfigManager;
}

export const App: React.FC<AppProps> = ({ initialPrompt, configManager }) => {
  const { exit } = useApp();
  const [mode, setMode] = useState<AppMode>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [sessionManager] = useState(() => new SessionManager());
  const [currentInput, setCurrentInput] = useState(initialPrompt || '');
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initialize provider
  useEffect(() => {
    try {
      const validation = configManager.validateConfig();
      if (!validation.valid) {
        setError(`Configuration error: ${validation.errors.join(', ')}`);
        return;
      }
      
      const aiProvider = ProviderFactory.createProvider(configManager);
      setProvider(aiProvider);
      
      // Load or create session
      sessionManager.getMostRecentSession().then(session => {
        if (session) {
          setMessages(session.messages);
          setCurrentSessionId(session.id);
        } else {
          sessionManager.createSession(
            configManager.getConfig().provider,
            configManager.getConfig().defaultModel
          ).then(newSession => {
            setCurrentSessionId(newSession.id);
          });
        }
      });
    } catch (err) {
      setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [configManager, sessionManager]);

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (key.ctrl && input === 'h') {
      setMode(mode === 'help' ? 'chat' : 'help');
      return;
    }

    if (key.ctrl && input === 's') {
      setMode(mode === 'sessions' ? 'chat' : 'sessions');
      return;
    }

    if (key.ctrl && input === 'r') {
      setMode(mode === 'config' ? 'chat' : 'config');
      return;
    }

    if (key.escape) {
      setMode('chat');
      setIsInputFocused(true);
      return;
    }
  });

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !provider || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentInput('');

    try {
      // Add user message to session
      await sessionManager.addMessage(userMessage);

      let assistantContent = '';
      let totalUsage = { inputTokens: 0, outputTokens: 0 };
      const assistantMessage: Message = { role: 'assistant', content: '' };
      
      // Stream the response
      for await (const chunk of provider.streamChat({
        messages: newMessages,
        model: configManager.getConfig().defaultModel,
        temperature: configManager.getConfig().temperature,
        maxTokens: configManager.getConfig().maxTokens,
      })) {
        if (chunk.message?.content) {
          assistantContent += chunk.message.content;
          assistantMessage.content = assistantContent;
          setMessages([...newMessages, { ...assistantMessage }]);
        }
        
        if (chunk.usage) {
          totalUsage.inputTokens += chunk.usage.inputTokens || 0;
          totalUsage.outputTokens += chunk.usage.outputTokens || 0;
        }
      }

      // Track cost for this interaction
      if (totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0) {
        await costTracker.trackUsage(
          provider.name,
          configManager.getConfig().defaultModel || provider.getDefaultModel(),
          totalUsage.inputTokens,
          totalUsage.outputTokens,
          currentSessionId || undefined
        );
      }

      // Save final assistant message to session
      await sessionManager.addMessage(assistantMessage);
    } catch (err) {
      setError(`Failed to get response: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [messages, provider, isLoading, configManager, sessionManager]);

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">🚨 FERAL CODE - ERROR</Text>
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    );
  }

  if (!provider) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">🚀 FERAL CODE</Text>
        <Box marginTop={1}>
          <Spinner type="dots" />
          <Text> Initializing...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Enhanced Header with Cost Tracking and Model Info */}
      <Header 
        provider={provider} 
        configManager={configManager} 
        currentSessionId={currentSessionId || undefined}
      />

      {/* Main content */}
      <Box flexGrow={1} flexDirection="row">
        {mode === 'chat' && (
          <Box flexDirection="column" flexGrow={1}>
            <ChatView 
              messages={messages}
              isLoading={isLoading}
              provider={provider.name}
              model={configManager.getConfig().defaultModel || provider.getDefaultModel()}
            />
            
            {/* Input area */}
            <Box borderStyle="round" paddingX={1} marginTop={1}>
              <Box width="100%">
                <Text color="cyan">💬 </Text>
                <TextInput
                  value={currentInput}
                  onChange={setCurrentInput}
                  onSubmit={handleSendMessage}
                  placeholder="Type your message..."
                  focus={isInputFocused}
                />
              </Box>
            </Box>
          </Box>
        )}

        {mode === 'sessions' && (
          <SessionList
            sessionManager={sessionManager}
            onSelectSession={(session) => {
              setMessages(session.messages);
              setMode('chat');
            }}
          />
        )}

        {mode === 'help' && <HelpPanel />}

        {mode === 'config' && (
          <Box flexDirection="column" padding={1}>
            <Text bold color="cyan">Configuration</Text>
            <Text>Provider: {configManager.getConfig().provider}</Text>
            <Text>Model: {configManager.getConfig().defaultModel || 'default'}</Text>
            <Text>Temperature: {configManager.getConfig().temperature}</Text>
            <Text>Max Tokens: {configManager.getConfig().maxTokens}</Text>
          </Box>
        )}
      </Box>

      {/* Status bar */}
      <StatusBar 
        mode={mode}
        provider={provider.name}
        model={configManager.getConfig().defaultModel || provider.getDefaultModel()}
        isLoading={isLoading}
      />
    </Box>
  );
};