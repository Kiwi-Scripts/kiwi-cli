import { Command } from '@lib/commands/command.types';
import logger from '@lib/util/logger';

const healthCommand = {
  name: 'health',
  description: 'Prints the current status of the kiwi cli.',
  run(ctx) {
    console.log()
    logger.log('KIWI loaded successfully with merged configs:');
    console.log(ctx.config);
  },
} as const satisfies Command;
export default healthCommand;