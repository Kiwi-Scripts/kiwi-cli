import logger, { setLogLevel } from '@lib/util/logger';

export interface GlobalFlags {
  verbose: boolean;
  dryRun: boolean;
}

export const globalFlags: GlobalFlags = {
  verbose: false,
  dryRun: false,
};

export function extractGlobalFlags(args: string[]) {
  let cleaned = [...args];
  cleaned = handleFlag(cleaned, '--verbose', () => {
    globalFlags.verbose = true;
    setLogLevel('debug');
  });
  cleaned = handleFlag(cleaned, '--dry-run', () => {
    globalFlags.dryRun = true;
  });
  if (globalFlags.verbose) {
    logger.debug('Global flags:', globalFlags);
    logger.debug('Arguments after extracting global flags:', cleaned);
  }
  return cleaned;
}

function handleFlag(args: string[], flag: string, activate: () => void): string[] {
  const index = args.indexOf(flag);
  if (index === -1) return args;
  activate();
  const cleaned = [...args];
  cleaned.splice(index, 1);
  return cleaned;
}