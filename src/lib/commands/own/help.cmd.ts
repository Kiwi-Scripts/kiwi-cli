import { getAllCommands } from '@lib/commands/command.registry';
import logger from '@lib/util/logger';

const helpCommand = {
  name: 'help',
  description: 'Show the help for a specific command or list available commands.',
  run() {
    logger.log();
    logger.log('Available Commands:');
    logger.log();

    const commands = getAllCommands();
    const nameColumnWidth = commands.reduce((longest, command) => Math.max(longest, command.name.length), 0) + 2;
    logger.log(`  ${'Command:'.padEnd(nameColumnWidth)} - Description:`);
    for (const command of commands) {
      logger.log(`  ${command.name.padEnd(nameColumnWidth)} - ${command.description}`);
    }
    logger.log();
  },
} as const;
export default helpCommand;