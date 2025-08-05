# GitHub Issue Resolver

A multi-model AI system for automatically analyzing and resolving GitHub issues using OpenAI, Anthropic, and local language models.

## Features

- 🤖 Multi-model support (OpenAI GPT-4, Anthropic Claude, local models)
- 🔍 Intelligent issue analysis and severity assessment
- 🛠️ Automated bug fixes and feature implementations
- 📊 Project health reporting and metrics
- 🔒 Security vulnerability scanning
- 💰 Cost tracking for AI usage

## Quick Start

### Installation

```bash
git clone <repository-url>
cd github-issue-resolver
bun run setup
```

### Configuration

Edit `.env` file with your API keys:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Usage

```bash
# List available models and tasks
bun run cli models
bun run cli tasks

# Analyze an issue
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123
bun run cli --repo owner/repo execute analyze-issue --issue 123

# Interactive mode
bun run cli --repo owner/repo interactive
```

## Available Tasks

- **analyze-issue**: Analyze issues for severity and complexity
- **bug-fix**: Generate bug fix implementations  
- **generate-report**: Create project health reports
- **security-scan**: Perform security vulnerability scanning
- **test-generation**: Generate test suites
- **documentation-update**: Update project documentation

## Development

```bash
bun run dev          # Development mode
bun test             # Run tests
bun run build        # Build project
bun run lint         # Lint code
```

## Configuration

Edit `config/default.json` to customize model preferences, cost limits, and task parameters.

## License

MIT License