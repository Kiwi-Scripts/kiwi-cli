import { getCommand } from '@lib/commands/command.registry';
import { KiwiConfig } from '@lib/config/config.types';
import { passthrough } from '@lib/core/passthrough';

export interface DispatchOptions {
  // Options for dispatch execution
}

/**
 * Parse raw argv. Strips the node binary and script path.
 */
export function parseArgv(argv: string[]) {
  const [command, ...args] = argv.slice(2);
  return {command, args};
}

export async function dispatch(command: string, args: string[], config: KiwiConfig = {}) {
  if (!command) {
    const help = getCommand('help');
    return await help.run({args: [], config});
  }

  const handler = getCommand(command);
  if (handler) {
    return await handler.run({args, config});
  }

  const exitCode = await passthrough(command, args);
  process.exitCode = exitCode;
}