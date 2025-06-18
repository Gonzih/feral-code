#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import React from 'react';
import { render } from 'ink';
import { ConfigManager } from './utils/config.js';
import { ProviderFactory } from './providers/index.js';
import { ToolManager } from './tools/index.js';
import { SessionManager } from './utils/session.js';
import { Message } from './types/index.js';
import { App } from './tui/app.js';

const program = new Command();

async function main() {
  const configManager = new ConfigManager();
  const toolManager = new ToolManager();

  program
    .name('feral-code')
    .description('An open-source agentic coding tool supporting multiple AI providers')
    .version('1.0.0')
    .addHelpText('after', ConfigManager.getEnvironmentVariableHelp());

  program
    .argument('[prompt]', 'Your prompt')
    .option('-d, --debug', 'Enable debug mode')
    .option('--verbose', 'Override verbose mode setting from config')
    .option('-p, --print', 'Print response and exit (useful for pipes)')
    .option('--output-format <format>', 'Output format (only works with --print)', 'text')
    .option('--input-format <format>', 'Input format', 'text')
    .option('--model <model>', 'Model for the current session')
    .option('--temperature <temperature>', 'Temperature for responses (0.0-1.0)', parseFloat)
    .option('--max-tokens <maxTokens>', 'Maximum tokens in response', parseInt)
    .option('--provider <provider>', 'AI provider to use (openai|openrouter|ollama)')
    .option('--no-tui', 'Disable TUI interface and use simple text mode')
    .option('--dangerously-skip-permissions', 'Skip permission prompts (use with caution)')
    .option('-c, --continue', 'Continue the most recent conversation')
    .option('-r, --resume [sessionId]', 'Resume a conversation by session ID')
    .action(async (prompt, options) => {
      try {
        // Override config with CLI options
        if (options.provider) {
          configManager.updateConfig({ provider: options.provider });
        }
        if (options.model) {
          configManager.updateConfig({ defaultModel: options.model });
        }
        if (options.temperature !== undefined) {
          configManager.updateConfig({ temperature: options.temperature });
        }
        if (options.maxTokens !== undefined) {
          configManager.updateConfig({ maxTokens: options.maxTokens });
        }
        if (options.verbose !== undefined) {
          configManager.updateConfig({ verbose: options.verbose });
        }
        if (options.dangerouslySkipPermissions !== undefined) {
          configManager.updateConfig({ dangerouslySkipPermissions: options.dangerouslySkipPermissions });
        }

        // Validate configuration
        const validation = configManager.validateConfig();
        if (!validation.valid) {
          console.error(chalk.red('Configuration errors:'));
          validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
          console.log(chalk.yellow('\\nRun "feral-code --help" for configuration help.'));
          process.exit(1);
        }

        const provider = ProviderFactory.createProvider(configManager);
        const config = configManager.getConfig();

        // Set config for tool manager
        toolManager.setConfig(config);

        if (options.debug || config.verbose) {
          console.log(chalk.gray(`Using provider: ${config.provider}`));
          console.log(chalk.gray(`Model: ${config.defaultModel || provider.getDefaultModel()}`));
          if (config.dangerouslySkipPermissions) {
            console.log(chalk.yellow(`⚠️  Permission checking disabled (dangerously-skip-permissions)`));
          }
        }

        if (prompt) {
          await handleSinglePrompt(prompt, provider, configManager, toolManager, options);
        } else {
          if (options.noTui || options.print) {
            await startInteractiveMode(provider, configManager, toolManager, options);
          } else {
            // Start TUI mode
            await startTUIMode(prompt, configManager, options);
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  program
    .command('config')
    .description('Show current configuration and environment variables help')
    .action(() => {
      const config = configManager.getConfig();
      console.log(chalk.blue('Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
      console.log(ConfigManager.getEnvironmentVariableHelp());
    });

  program
    .command('models')
    .description('List supported models for the current provider')
    .action(async () => {
      try {
        const provider = ProviderFactory.createProvider(configManager);
        const models = await Promise.resolve(provider.getSupportedModels());
        console.log(chalk.blue(`Supported models for ${provider.name}:`));
        models.forEach((model: string) => {
          const isDefault = model === provider.getDefaultModel();
          console.log(`  ${isDefault ? '* ' : '  '}${model}${isDefault ? ' (default)' : ''}`);
        });
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  program
    .command('sessions')
    .description('Manage conversation sessions')
    .option('-l, --list', 'List all sessions')
    .option('-d, --delete <sessionId>', 'Delete a session')
    .option('-e, --export <sessionId>', 'Export a session')
    .option('--format <format>', 'Export format (json|markdown)', 'json')
    .action(async (options) => {
      const sessionManager = new SessionManager();
      
      if (options.list) {
        const sessions = await sessionManager.listSessions();
        if (sessions.length === 0) {
          console.log(chalk.gray('No sessions found.'));
          return;
        }
        
        console.log(chalk.blue('Conversation Sessions:'));
        sessions.forEach(session => {
          console.log(`${chalk.green(session.id)} - ${session.title}`);
          console.log(`  ${chalk.gray(`${session.messages.length} messages, ${session.provider}, ${session.updated.toLocaleString()}`)}`);
        });
      } else if (options.delete) {
        const deleted = await sessionManager.deleteSession(options.delete);
        if (deleted) {
          console.log(chalk.green(`Session ${options.delete} deleted successfully.`));
        } else {
          console.log(chalk.red(`Session ${options.delete} not found.`));
        }
      } else if (options.export) {
        try {
          const exported = await sessionManager.exportSession(options.export, options.format);
          console.log(exported);
        } catch (error) {
          console.error(chalk.red(`Failed to export session: ${error instanceof Error ? error.message : String(error)}`));
        }
      } else {
        console.log(chalk.yellow('Use --list, --delete <id>, or --export <id>'));
      }
    });

  await program.parseAsync();
}

async function startTUIMode(initialPrompt: string | undefined, configManager: ConfigManager, options: any): Promise<void> {
  try {
    const { waitUntilExit } = render(React.createElement(App, {
      initialPrompt,
      configManager,
    }));
    
    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('TUI Error:'), error instanceof Error ? error.message : String(error));
    console.log(chalk.yellow('Falling back to text mode...'));
    // Fallback to text mode
    const provider = ProviderFactory.createProvider(configManager);
    const toolManager = new ToolManager();
    await startInteractiveMode(provider, configManager, toolManager, { ...options, noTui: true });
  }
}

async function handleSinglePrompt(
  prompt: string,
  provider: any,
  configManager: ConfigManager,
  toolManager: ToolManager,
  options: any
) {
  const config = configManager.getConfig();
  const messages: Message[] = [
    { role: 'user', content: prompt }
  ];

  try {
    if (options.print) {
      if (options.outputFormat === 'stream-json') {
        for await (const chunk of provider.streamChat({
          messages,
          model: config.defaultModel,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          tools: toolManager.getToolDefinitions(),
        })) {
          if (chunk.message?.content) {
            process.stdout.write(JSON.stringify(chunk) + '\\n');
          }
        }
      } else {
        const response = await provider.chat({
          messages,
          model: config.defaultModel,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          tools: toolManager.getToolDefinitions(),
        });
        
        if (options.outputFormat === 'json') {
          console.log(JSON.stringify(response));
        } else {
          console.log(response.message.content);
        }
      }
    } else {
      // Interactive mode with streaming
      for await (const chunk of provider.streamChat({
        messages,
        model: config.defaultModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: toolManager.getToolDefinitions(),
      })) {
        if (chunk.message?.content) {
          process.stdout.write(chunk.message.content);
        }
      }
      console.log(); // New line at the end
    }
  } catch (error) {
    throw error;
  }
}

async function startInteractiveMode(
  provider: any,
  configManager: ConfigManager,
  toolManager: ToolManager,
  options: any
) {
  console.log(chalk.green('Welcome to FERAL CODE!'));
  console.log(chalk.gray('Type your requests and press Enter. Type "exit" to quit.\\n'));

  const config = configManager.getConfig();
  const messages: Message[] = [];

  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.blue('> '),
      }
    ]);

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log(chalk.green('Goodbye!'));
      break;
    }

    if (!input.trim()) {
      continue;
    }

    messages.push({ role: 'user', content: input });

    try {
      let assistantMessage = '';
      
      for await (const chunk of provider.streamChat({
        messages,
        model: config.defaultModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: toolManager.getToolDefinitions(),
      })) {
        if (chunk.message?.content) {
          process.stdout.write(chunk.message.content);
          assistantMessage += chunk.message.content;
        }
      }
      
      console.log(); // New line
      messages.push({ role: 'assistant', content: assistantMessage });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}