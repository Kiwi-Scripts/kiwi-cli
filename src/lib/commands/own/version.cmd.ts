import logger from '@lib/util/logger';
import version from '@lib/version';

const versionCommand = {
  name: 'version',
  description: 'Prints the current kiwi-cli version.',
  run() {
    logger.log();
    logger.log('**********************');
    logger.log('*  --- KIWI-CLI ---  *');
    logger.log('**********************');
    logger.log();
    logger.log('Version:', version);
    logger.log();
  },
} as const;
export default versionCommand;