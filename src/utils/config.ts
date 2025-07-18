import * as fs from 'fs';
import * as path from 'path';

export function loadConfig(): any {
  const configPath = path.join(__dirname, '../../config/default.json');
  
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  }

  // Default configuration
  return {
    github: {
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      token: process.env.GITHUB_TOKEN || ''
    },
    ai: {
      defaultModel: process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-20241022',
      fallbackModel: 'gpt-4o-mini',
      taskPreferences: {
        'analyze-issue': 'claude-3-5-sonnet-20241022',
        'bug-fix': 'gpt-4o',
        'feature-implementation': 'claude-3-5-sonnet-20241022',
        'documentation-update': 'gpt-4o-mini',
        'security-scan': 'gpt-4o',
        'test-generation': 'claude-3-haiku-20240307'
      }
    },
    limits: {
      maxDailyCost: parseFloat(process.env.MAX_DAILY_COST || '10.00'),
      maxTokensPerRequest: 8000
    }
  };
}

export function saveConfig(config: any): void {
  const configPath = path.join(__dirname, '../../config/default.json');
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}