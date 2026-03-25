import { defineCommand } from '@lib/commands/command.types';
import logger from '@lib/util/logger';
import version from '@lib/version';

const versionCommand = defineCommand({
  name: 'version',
  description: 'Prints the current kiwi-cli version.',
  run() {
    logger.np.log();
    logger.ml.log(
      '**********************',
      '*  --- KIWI-CLI ---  *',
      '**********************',
      `\nVersion: ${version}`
    );
    logger.np.log();
  },
})
export default versionCommand;