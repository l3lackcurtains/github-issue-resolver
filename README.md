# GitHub Issue Resolver

A multi-model AI system for automatically analyzing and resolving GitHub issues using OpenAI, Anthropic, and local language models.

## Features

- 🤖 **Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, local models
- 🔍 **Intelligent Analysis**: Automatic issue severity and complexity assessment
- 🛠️ **Code Generation**: Bug fixes, feature implementations, and tests
- 📊 **Reporting**: Comprehensive project health reports
- 💰 **Cost Tracking**: Monitor AI usage and costs

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

# Execute tasks
bun run cli --repo owner/repo execute <task>
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123

# Interactive mode
bun run cli --repo owner/repo interactive
```

## Available Tasks

- **analyze-issue**: Analyze specific issues for severity and complexity
- **bug-fix**: Generate bug fix implementations
- **generate-report**: Create project health reports
- **security-scan**: Perform security vulnerability scanning
- **test-generation**: Generate comprehensive test suites

## Development

```bash
bun run dev     # Development mode
bun test        # Run tests
bun run build   # Build project
bun run lint    # Lint code
```

## License

MIT License - see LICENSE file for details.