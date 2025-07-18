# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based GitHub issue resolver that uses multiple AI models (OpenAI, Anthropic, local models) to automatically analyze and resolve GitHub issues. The project is structured as a CLI tool with modular task management.

## Essential Commands

### Development
- `npm run dev` - Run in development mode using ts-node
- `npm run build` - Build TypeScript to JavaScript
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run lint:fix` - Auto-fix linting issues

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- src/models/ModelManager.test.ts` - Run a specific test file

### CLI Operations
- `npm run cli` - Run CLI in development mode
- `npm run cli models` - List available AI models
- `npm run cli execute <task> --issue <number>` - Execute a specific task
- `npm run cli interactive` - Start interactive mode

### Setup
- `npm run setup` - Run initial setup script (creates .env, installs dependencies)

## Architecture Overview

The codebase follows a modular architecture with clear separation of concerns:

### Core Module Structure
- **Models Layer** (`/src/models`): Manages AI provider integrations. Each provider (OpenAI, Anthropic, Local) implements a common interface managed by `ModelManager.ts`.
- **Tasks Layer** (`/src/tasks`): Contains all task implementations organized by category (Analysis, Resolution, Maintenance, Reporting). `TaskManager.ts` orchestrates task execution.
- **GitHub Layer** (`/src/github`): Wraps GitHub API interactions through `GitHubClient.ts`.
- **CLI Layer** (`/src/cli`): Command-line interface implementation using Commander.js.

### Key Design Patterns
1. **Provider Pattern**: AI models are abstracted behind provider interfaces, allowing easy addition of new model providers.
2. **Task Registry**: Tasks are registered dynamically and can be executed through a unified interface.
3. **Configuration-Driven**: Model selection for tasks is configured in `config/default.json`.
4. **TypeScript Path Aliases**: Uses `@models`, `@tasks`, `@github`, `@utils` for cleaner imports.

### Critical Integration Points
- **Model Selection**: `ModelManager` automatically selects optimal models based on task type and configuration.
- **Cost Tracking**: All AI API calls are tracked for cost management.
- **Error Handling**: Comprehensive error handling with fallback to alternative models when available.
- **Logging**: Winston-based logging system with different log levels.

## Configuration Management

The project uses a layered configuration approach:
1. **Environment Variables** (`.env`): API keys and sensitive data
2. **Default Config** (`config/default.json`): Task preferences, model mappings, limits
3. **Runtime Config**: Can be overridden via CLI flags

Required environment variables:
- `GITHUB_TOKEN`: GitHub personal access token
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional)
- `GITHUB_OWNER`: Repository owner
- `GITHUB_REPO`: Repository name

## Testing Strategy

Tests are organized by module with Jest as the test runner:
- Unit tests for individual components
- Integration tests for API interactions
- Mock providers for external services
- Test files follow `*.test.ts` or `*.spec.ts` naming convention

## Build and Deployment

The project compiles TypeScript to CommonJS:
- Source: `/src` → Target: `/dist`
- Entry point: `dist/cli/index.js` (exposed as `github-resolver` binary)
- Strict TypeScript compilation with full type checking