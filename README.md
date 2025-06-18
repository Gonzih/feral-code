# Feral Code

![](https://img.shields.io/badge/Node.js-18%2B-brightgreen?style=flat-square) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Feral Code is an open-source agentic coding tool that supports multiple AI providers and lives in your terminal to help you code faster. It understands your codebase and helps you execute routine tasks, explain complex code, and handle development workflows through natural language commands.

**🐺 Born to be wild, built to be free**

## Features

- **Multiple AI Providers**: Support for OpenAI GPT models, OpenRouter, and Ollama
- **Environment-based Configuration**: Configure everything via environment variables
- **Interactive & Non-Interactive modes**: Use in terminal or pipe commands
- **Built-in Tools**: File operations, bash commands, and more
- **Streaming Responses**: Real-time response streaming
- **TypeScript**: Fully typed codebase with high test coverage
- **MCP Support**: Model Context Protocol integration
- **Privacy First**: No telemetry, no data collection

## Quick Start

1. Install Feral Code:

```sh
npm install -g feral-code
```

2. Set up your environment variables (see Configuration section below)

3. Navigate to your project directory and run `feral-code`

## Configuration

Feral Code is configured entirely through environment variables:

### Required Configuration

Set your AI provider:
```sh
export FERAL_CODE_PROVIDER=openai  # or openrouter, ollama
```

Set the appropriate API key for your provider:
```sh
# For OpenAI  
export OPENAI_API_KEY=your_openai_key_here

# For OpenRouter
export OPENROUTER_API_KEY=your_openrouter_key_here

# For Ollama (no key needed, just ensure Ollama is running)
export OLLAMA_HOST=http://localhost:11434  # optional, defaults to localhost:11434
```

### Optional Configuration

```sh
# Model selection (provider-specific)
export FERAL_CODE_MODEL=gpt-4-turbo-preview          # OpenAI  
export FERAL_CODE_MODEL=openai/gpt-4                 # OpenRouter
export FERAL_CODE_MODEL=llama3.1:8b                  # Ollama

# Response settings
export FERAL_CODE_TEMPERATURE=0.7      # 0.0-1.0, default: 0.7
export FERAL_CODE_MAX_TOKENS=4000      # default: 4000
export FERAL_CODE_VERBOSE=true         # Enable verbose logging

# Tool restrictions
export FERAL_CODE_ALLOWED_TOOLS=Bash,Read,Write     # Comma-separated
export FERAL_CODE_DISALLOWED_TOOLS=Bash             # Comma-separated
```

### Supported Models

**OpenAI:**
- gpt-4-turbo-preview (default)
- gpt-4
- gpt-4-32k
- gpt-3.5-turbo
- gpt-3.5-turbo-16k

**OpenRouter:**
- openai/gpt-4-turbo-preview (default)
- openai/gpt-4
- meta-llama/llama-3.1-405b-instruct
- google/gemini-pro-1.5
- mistralai/mistral-large
- And many more...

**Ollama:**
- llama3.1:8b (default)
- llama3.1:70b
- codellama:7b
- codellama:13b
- mistral:7b
- And any locally available model

## Usage

### Interactive Mode
```sh
feral-code
```

### Single Command Mode
```sh
feral-code "Explain this function"
feral-code "Create a new React component"
```

### CLI Options
```sh
feral-code --help                    # Show help and environment variables
feral-code --provider openai         # Override provider for this session
feral-code --model gpt-4             # Override model for this session
feral-code --temperature 0.5         # Set temperature
feral-code --print "Your prompt"     # Print response and exit
feral-code --output-format json      # JSON output format
feral-code config                    # Show current configuration
feral-code models                    # List supported models
```

## Development

### Building from Source

```sh
git clone <your-fork-url>
cd feral-code
npm install
npm run build
npm link  # Install globally for development
```

### Running Tests

```sh
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint            # Run linter
```

### Project Structure

```
src/
├── providers/          # AI provider implementations
│   ├── openai.ts      # OpenAI GPT integration
│   ├── openrouter.ts  # OpenRouter integration
│   └── ollama.ts      # Ollama integration
├── tools/             # Built-in tools (Bash, Read, Write, etc.)
├── utils/             # Configuration and utilities
├── types/             # TypeScript type definitions
└── cli.ts            # Main CLI application
```

## Contributing

This project is an open-source coding assistant. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE.md for details.

## Privacy

Feral Code:
- Does not collect usage data or telemetry
- Processes all requests through your chosen AI provider
- Stores no conversation history or personal data
- Is fully open source and transparent

Your data is only sent to the AI provider you configure and is subject to their privacy policies.

## Philosophy

Feral Code embodies the spirit of untamed development - powerful, independent, and free from corporate constraints. Like its namesake, it adapts to any environment, hunts down bugs with precision, and runs wild in your terminal.

**Code fearlessly. Code freely. Code feral.**