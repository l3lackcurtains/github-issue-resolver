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
# Commands that don't require repository:
bun run cli models              # List available AI models
bun run cli tasks               # List available tasks
bun run cli usage               # View usage statistics

# Commands that require repository (via --repo flag):
bun run cli --repo owner/repo execute <task>
bun run cli --repo owner/repo interactive
bun run cli --repo owner/repo switch <model>
bun run cli --repo owner/repo suggest <input>

# Analyze an issue (repository from issue URL)
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123

# Analyze an issue (explicit repository)
bun run cli --repo owner/repo execute analyze-issue --issue 123

# Also supports shorter URL formats
bun run cli execute analyze-issue --issue owner/repo#123

# Interactive mode with repository
bun run cli --repo myorg/myrepo interactive

# Generate project report
bun run cli --repo owner/repo execute generate-report
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

The system automatically selects optimal models for each task:

- **Code Analysis**: Claude-3.5-Sonnet (superior reasoning)
- **Bug Fixes**: GPT-4 (excellent debugging)
- **Documentation**: GPT-4-mini (cost-effective)
- **Security**: GPT-4 (thorough analysis)
- **Quick Tasks**: Local models (no API costs)

## CLI Commands

```bash
# Repository can be specified in multiple ways:
# 1. Via --repo flag: --repo owner/repo or --repo https://github.com/owner/repo
# 2. Via issue URL: --issue https://github.com/owner/repo/issues/123
# 3. Via environment variables (GITHUB_OWNER and GITHUB_REPO)
# 4. Via config file

# Commands that don't require repository:
github-resolver models            # List available models
github-resolver tasks             # List available tasks  
github-resolver usage             # View usage statistics

# Commands that require repository:
github-resolver --repo owner/repo switch <model>  # Switch primary model
github-resolver --repo owner/repo execute <task> [options]  # Execute specific task
github-resolver --repo owner/repo suggest <input>  # Get task suggestions
github-resolver --repo owner/repo interactive  # Start interactive session
```

### Issue Reference Formats

The CLI supports multiple formats for referencing GitHub issues:

```bash
# Using issue number (requires --repo flag)
bun run cli --repo owner/repo execute analyze-issue --issue 123

# Using full GitHub URL (repository inferred from URL)
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123

# Using short GitHub URL
bun run cli execute analyze-issue --issue github.com/owner/repo/issues/123

# Using repository path format
bun run cli execute analyze-issue --issue owner/repo/issues/123

# Using hash format
bun run cli execute analyze-issue --issue owner/repo#123
```

When using issue URLs, the repository context is automatically extracted from the URL, so you don't need to specify --repo.

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