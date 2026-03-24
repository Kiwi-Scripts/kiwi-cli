import logger from '@lib/util/logger';

export async function copyToClipboard(text: string) {
  try {
    return await import('clipboardy').then(mod => {
      mod.default.writeSync(text);
      logger.debug(`Wrote '${text}' to clipboard.`);
      return true;
    });
  } catch (error) {
    logger.warn(`Could not copy to clipboard. Make sure 'clipboardy' is installed.`);
  }
}