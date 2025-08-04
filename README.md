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

```bash
# Installation
git clone <repository-url>
cd github-issue-resolver
bun run setup

# Configuration - Edit .env with your API keys
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Usage examples
bun run cli models                                    # List models
bun run cli --repo owner/repo execute <task>         # Execute task
bun run cli execute analyze-issue --issue owner/repo#123  # Analyze issue
bun run cli --repo owner/repo interactive            # Interactive mode
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

## Repository & Issue Formats

Repository can be specified via `--repo owner/repo`, issue URLs, or environment variables. 
Issues support multiple formats: `owner/repo#123`, `https://github.com/owner/repo/issues/123`, or just `123` with `--repo`.

## Development

```bash
bun run dev        # Development mode
bun test           # Run tests
bun run build      # Build project
bun run lint:fix   # Lint and fix
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

Fork → Create branch → Make changes → Add tests → Submit PR

## License

MIT License - see LICENSE file for details.