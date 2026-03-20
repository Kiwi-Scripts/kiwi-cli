import logger from '@lib/util/logger';
import version from '@lib/version';

const versionCommand = {
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
} as const;
export default versionCommand;