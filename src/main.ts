import dotenv from 'dotenv';
import { CLI } from './cli/CLI';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('Starting GitHub Issue Resolver');
    
    const cli = new CLI();
    cli.run();
  } catch (error) {
    logger.error('Application failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}