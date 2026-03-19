import { getCommand } from '@lib/commands/command.registry';
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

export async function dispatch(command: string, args: string[], options: DispatchOptions = {}) {
  if (!command) {
    const help = getCommand('help');
    return await help.run({args: []});
  }

  const handler = getCommand(command);
  if (handler) {
    return await handler.run({args});
  }

  const exitCode = await passthrough(command, args);
  process.exitCode = exitCode;
}