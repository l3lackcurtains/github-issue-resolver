# GitHub Issue Resolver

A multi-model AI system for automatically analyzing and resolving GitHub issues.

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

# Interactive mode
bun run cli --repo owner/repo interactive
```

## Development

```bash
bun run dev     # Development mode
bun test        # Run tests
bun run build   # Build project
```

## License

MIT License