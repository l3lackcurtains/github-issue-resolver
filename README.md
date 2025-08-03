# GitHub Issue Resolver

A powerful multi-model AI system for automatically analyzing and resolving GitHub issues using OpenAI, Anthropic, and local language models.

## Features

- 🤖 **Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, local models
- 🔍 **Intelligent Analysis**: Automatic issue severity and complexity assessment
- 🛠️ **Code Generation**: Bug fixes, feature implementations, and tests
- 📊 **Reporting**: Comprehensive project health reports
- 🔒 **Security Scanning**: Automated vulnerability detection
- 📚 **Documentation**: Automatic documentation updates
- 💰 **Cost Tracking**: Monitor AI usage and costs
- 🎯 **Task Automation**: Smart task suggestions and execution

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
# List available models and tasks
bun run cli models
bun run cli tasks

# Execute tasks
bun run cli --repo owner/repo execute <task>
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123

# Interactive mode
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

The system automatically selects optimal models for each task based on complexity and requirements.

## Development

```bash
# Development mode
bun run dev

# Run tests
bun test
bun run test:watch

# Build project
bun run build

# Linting
bun run lint
bun run lint:fix
```

## Architecture

```
src/
├── models/          # AI model providers and management
├── tasks/           # Task implementations
├── github/          # GitHub API integration
├── cli/             # Command-line interface
└── utils/           # Utilities and configuration
```

## Configuration

Edit `config/default.json` to customize:

- Model preferences for specific tasks
- Cost limits and token restrictions
- GitHub repository settings
- Task-specific parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.