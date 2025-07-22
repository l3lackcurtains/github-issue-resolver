# GitHub Issue Resolver

A TypeScript-based AI system for automatically analyzing and resolving GitHub issues using multiple AI models.

## Quick Start

### Installation
```bash
git clone <repository-url>
cd github-issue-resolver
npm run setup
```

### Configuration
Set up your `.env` file:
```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GITHUB_OWNER=owner
GITHUB_REPO=repo
```

### Usage
```bash
# List available models and tasks
npm run cli models
npm run cli tasks

# Execute tasks
npm run cli execute analyze-issue --issue 123
npm run cli execute bug-fix --issue 123
npm run cli interactive
```

## Available Tasks

**Analysis**: analyze-issue, triage-issues, code-analysis  
**Resolution**: bug-fix, feature-implementation, refactor  
**Maintenance**: test-generation, security-scan, cleanup  
**Reporting**: generate-report, health-check

## Development
```bash
npm run dev          # Development mode
npm test             # Run tests
npm run build        # Build project
npm run lint         # Check code style
```

## License

MIT License