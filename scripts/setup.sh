#!/bin/bash

echo "Setting up GitHub Issue Resolver..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! npx semver-compare $NODE_VERSION gte $REQUIRED_VERSION &> /dev/null; then
    echo "Error: Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

echo "✓ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "Installing dependencies..."
npm install

# Install global dependencies if needed
echo "Installing global dependencies..."
npm install -g typescript ts-node

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p config
mkdir -p data

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
fi

# Create default config if it doesn't exist
if [ ! -f config/default.json ]; then
    echo "Creating default configuration..."
    cat > config/default.json << EOF
{
  "github": {
    "owner": "",
    "repo": "",
    "token": ""
  },
  "ai": {
    "defaultModel": "claude-3-5-sonnet-20241022",
    "fallbackModel": "gpt-4o-mini",
    "taskPreferences": {
      "analyze-issue": "claude-3-5-sonnet-20241022",
      "bug-fix": "gpt-4o",
      "feature-implementation": "claude-3-5-sonnet-20241022",
      "documentation-update": "gpt-4o-mini",
      "security-scan": "gpt-4o",
      "test-generation": "claude-3-haiku-20240307"
    }
  },
  "limits": {
    "maxDailyCost": 10.00,
    "maxTokensPerRequest": 8000
  }
}
EOF
fi

# Build the project
echo "Building project..."
npm run build

# Run tests to verify setup
echo "Running tests..."
npm test

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - GITHUB_TOKEN=your_github_token"
echo "   - OPENAI_API_KEY=your_openai_key (optional)"
echo "   - ANTHROPIC_API_KEY=your_anthropic_key (optional)"
echo ""
echo "2. Edit config/default.json with your preferences"
echo ""
echo "3. Try the CLI:"
echo "   npm run cli models              # List available models"
echo "   npm run cli tasks               # List available tasks"
echo "   npm run cli interactive         # Start interactive mode"
echo ""
echo "4. Execute tasks:"
echo "   npm run cli execute analyze-issue --issue 123"
echo "   npm run cli execute triage-issues"
echo ""
echo "5. For development:"
echo "   npm run dev                     # Start in development mode"
echo "   npm run test:watch              # Run tests in watch mode"