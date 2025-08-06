# GitHub Issue Resolver

A multi-model AI system for automatically analyzing and resolving GitHub issues using OpenAI, Anthropic, and local language models.

## Features

- Multi-model AI support (OpenAI, Anthropic, local models)
- Intelligent issue analysis and code generation
- Security scanning and documentation updates
- Cost tracking and task automation

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd github-issue-resolver
bun run setup
```

### 2. Configuration

Edit `.env` file with your API keys:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Usage

```bash
# Basic commands
bun run cli models              # List available AI models
bun run cli tasks               # List available tasks

# Execute tasks
bun run cli --repo owner/repo execute <task>
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123
bun run cli --repo owner/repo interactive
```

## Available Tasks

### Analysis Tasks
- **analyze-issue**: Analyze specific issues for severity and complexity
- **triage-issues**: Auto-triage and prioritize open issues
- **find-duplicates**: Detect duplicate or similar issues
- **code-analysis**: Analyze code quality

### Resolution Tasks
- **bug-fix**: Generate bug fix implementations
- **feature-implementation**: Create feature implementation plans
- **documentation-update**: Update project documentation
- **refactor**: Suggest code refactoring improvements

### Maintenance Tasks
- **test-generation**: Generate comprehensive test suites
- **security-scan**: Perform security vulnerability scanning
- **dependency-update**: Check and update dependencies
- **cleanup**: Clean up unused code and files

### Reporting Tasks
- **generate-report**: Create project health reports
- **metrics**: Collect and analyze project metrics
- **progress-tracking**: Track milestone progress
- **health-check**: Perform project health assessment

## Model Selection

The system automatically selects optimal models based on task requirements. Configure preferences in `config/default.json`.

## Development

```bash
bun run dev          # Development mode
bun test             # Run tests
bun run build        # Build project
bun run lint         # Linting
```

## Configuration

Edit `config/default.json` to customize model preferences, cost limits, and task parameters.

## License

MIT License - see LICENSE file for details.