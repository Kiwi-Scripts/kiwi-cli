import { logger, setLoggerConfigValue, setLogLevel } from '@kiwi-js/cli/api';

export interface GlobalFlags {
  debug: boolean;
  verbose: boolean;
  dryRun: boolean;
}

export const globalFlags: GlobalFlags = {
  debug: false,
  verbose: false,
  dryRun: false,
};

export function extractGlobalFlags(args: string[]) {
  let cleaned = [...args];
  cleaned = handleFlag(cleaned, '--debug', () => {
    globalFlags.debug = true;
    setLogLevel('debug');
  });
  cleaned = handleFlag(cleaned, '--verbose', () => {
    globalFlags.verbose = true;
    setLogLevel('trace');
  });
  cleaned = handleFlag(cleaned, '--timestamp', () => {
    globalFlags.verbose = true;
    setLoggerConfigValue('showTimestamp', true);
  });
  cleaned = handleFlag(cleaned, '--dry-run', () => {
    globalFlags.dryRun = true;
  });
  if (logger.shouldLog('debug')) {
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