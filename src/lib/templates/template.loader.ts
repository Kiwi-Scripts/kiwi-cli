import logger from '@lib/util/logger';

export async function loadTemplates() {
  const mod = await import('@lib/templates/template.registry');
  if (logger.shouldLog('debug')) logger.ml.debug(`[${Object.keys(mod).length}] Templates loaded: ${Object.keys(mod).join(', ')}`);
  return mod;
}