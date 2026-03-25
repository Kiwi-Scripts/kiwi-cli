import logger, { setLogLevel } from '@lib/util/logger';

export function extractGlobalFlags(args: string[]) {
  return handleVerbose(args);
}

function handleVerbose(args: string[]) {
  if (args.includes('--verbose')) {
    setLogLevel('debug');
    const cleanedArgs = [...args];
    cleanedArgs.splice(args.indexOf('--verbose'), 1);
    logger.debug('Verbose mode enabled. Arguments after removing --verbose:', cleanedArgs);
    return cleanedArgs;
  }
  return args;
}