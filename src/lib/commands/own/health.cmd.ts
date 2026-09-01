import { logger } from '@kiwi-js/cli/api';
import { defineCommand } from '@lib/commands/command.types';

const healthCommand = defineCommand({
  name: 'health',
  description: 'Prints the current status of the kiwi cli.',
  run(ctx) {
    logger.np.log()
    logger.log('KIWI loaded successfully with merged configs:\n', ctx.config);
  },
});
export default healthCommand;