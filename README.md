# GitHub Issue Resolver

AI-powered GitHub issue analyzer and resolver supporting multiple models (OpenAI, Anthropic, local).

## Features

- Multi-model AI support (GPT-4, Claude, local models)
- Automatic issue analysis and resolution
- Code generation and bug fixes

## Quick Start

```bash
git clone https://github.com/l3lackcurtains/github-issue-resolver
cd github-issue-resolver
npm run setup
```

Edit `.env` with your API keys:
```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Usage

```bash
npm run cli execute analyze-issue --issue owner/repo#123
npm run cli --repo owner/repo interactive
```

## Development

```bash
npm run dev      # Development mode
npm test         # Run tests  
npm run build    # Build project
```

## License

MIT License