# GitHub Issue Resolver

AI system for automatically analyzing and resolving GitHub issues using multiple language models.

## Features

- Multi-model support (OpenAI, Anthropic, local models)
- Automated issue analysis and resolution
- Code generation and bug fixes
- Project health reporting
- Cost tracking

## Quick Start

```bash
git clone <repository-url>
cd github-issue-resolver
bun run setup
```

Configure your API keys in `.env`:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Usage

```bash
# List available models and tasks
bun run cli models
bun run cli tasks

# Analyze an issue
bun run cli execute analyze-issue --issue https://github.com/owner/repo/issues/123
bun run cli --repo owner/repo execute analyze-issue --issue 123

# Interactive mode
bun run cli --repo owner/repo interactive

# Generate project report
bun run cli --repo owner/repo execute generate-report
```

## Available Tasks

- **Analysis**: analyze-issue, triage-issues, code-analysis
- **Resolution**: bug-fix, feature-implementation, refactor
- **Maintenance**: test-generation, security-scan, cleanup
- **Reporting**: generate-report, metrics, health-check

## Development

```bash
bun run dev          # Development mode
bun test             # Run tests
bun run build        # Build project
bun run lint         # Lint code
```

## License

MIT License