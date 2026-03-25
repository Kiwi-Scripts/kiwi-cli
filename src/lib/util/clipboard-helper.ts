import logger from '@lib/util/logger';
import { tryLoadOptionalDep } from '@lib/util/optional-deps';

export async function copyToClipboard(text: string) {
  const clipboardy = await tryLoadOptionalDep('clipboardy');
  if (!clipboardy) return false;
  clipboardy.default.writeSync(text);
  logger.debug(`Wrote '${text}' to clipboard.`);
  return true;
}