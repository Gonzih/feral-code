import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { AIProvider } from '../../types/index.js';
import { costTracker } from '../../utils/costTracker.js';
import { ConfigManager } from '../../utils/config.js';

interface HeaderProps {
  provider: AIProvider | null;
  configManager: ConfigManager;
  currentSessionId?: string;
}

export const Header: React.FC<HeaderProps> = ({ provider, configManager, currentSessionId }) => {
  const [todayCost, setTodayCost] = useState(0);
  const [monthCost, setMonthCost] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [modelInfo, setModelInfo] = useState<{
    model: string;
    provider: string;
    location: string;
  } | null>(null);

  useEffect(() => {
    const updateCosts = async () => {
      try {
        const [todayTotal, monthTotal, sessionTotal] = await Promise.all([
          costTracker.getTodayCost(),
          costTracker.getMonthCost(),
          currentSessionId ? costTracker.getCurrentSessionCost(currentSessionId) : Promise.resolve(0),
        ]);

        setTodayCost(todayTotal);
        setMonthCost(monthTotal);
        setSessionCost(sessionTotal);
      } catch (error) {
        // Silently handle errors
      }
    };

    const updateModelInfo = async () => {
      if (provider) {
        try {
          // Try to get model info if provider supports it
          if ('getModelInfo' in provider && typeof provider.getModelInfo === 'function') {
            const info = await (provider as any).getModelInfo();
            setModelInfo(info);
          } else {
            // Fallback to basic info
            const config = configManager.getConfig();
            setModelInfo({
              model: config.model || provider.getDefaultModel(),
              provider: provider.name,
              location: provider.name === 'ollama' ? 'Local/Remote' : 'Remote',
            });
          }
        } catch (error) {
          // Fallback for any errors
          const config = configManager.getConfig();
          setModelInfo({
            model: config.model || provider.getDefaultModel(),
            provider: provider.name,
            location: 'Unknown',
          });
        }
      }
    };

    updateCosts();
    updateModelInfo();

    // Update costs every 10 seconds
    const interval = setInterval(updateCosts, 10000);
    return () => clearInterval(interval);
  }, [provider, configManager, currentSessionId]);

  const formatCost = (cost: number): string => {
    if (cost === 0) return 'Free';
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(cost < 0.01 ? 4 : 3)}`;
  };

  const getProviderColor = (providerName: string): string => {
    switch (providerName.toLowerCase()) {
      case 'anthropic': return 'magenta';
      case 'openai': return 'green';
      case 'openrouter': return 'blue';
      case 'ollama': return 'cyan';
      default: return 'white';
    }
  };

  const getLocationIcon = (location: string): string => {
    if (location.toLowerCase().includes('local')) return '🏠';
    if (location.toLowerCase().includes('remote')) return '☁️';
    return '🌐';
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {/* Top row - Title and Model Info */}
      <Box justifyContent="space-between" paddingY={0}>
        <Box>
          <Text bold color="cyan">Feral Code</Text>
          <Text color="gray"> - AI Assistant</Text>
        </Box>
        {modelInfo && (
          <Box>
            <Text>{getLocationIcon(modelInfo.location)} </Text>
            <Text bold color={getProviderColor(modelInfo.provider)}>
              {modelInfo.provider.toUpperCase()}
            </Text>
            <Text color="gray"> / </Text>
            <Text color="yellow">{modelInfo.model}</Text>
            <Text color="gray"> ({modelInfo.location})</Text>
          </Box>
        )}
      </Box>

      {/* Bottom row - Cost Information */}
      <Box justifyContent="space-between" paddingY={0}>
        <Box>
          <Text color="gray">💰 Costs: </Text>
          <Text color="green">Session: {formatCost(sessionCost)}</Text>
          <Text color="gray"> • </Text>
          <Text color="blue">Today: {formatCost(todayCost)}</Text>
          <Text color="gray"> • </Text>
          <Text color="yellow">Month: {formatCost(monthCost)}</Text>
        </Box>
        <Box>
          <Text color="gray">🎯 </Text>
          <Text color="cyan">Ctrl+H</Text>
          <Text color="gray"> Help • </Text>
          <Text color="cyan">Ctrl+C</Text>
          <Text color="gray"> Exit</Text>
        </Box>
      </Box>
    </Box>
  );
};