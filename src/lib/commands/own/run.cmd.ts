import { defineCommand } from '@lib/commands/command.types';
import { createScriptContext } from '@lib/scripts/script.context';
import { getAllScripts, getScript } from '@lib/scripts/script.registry';
import { Script, ScriptInputDef } from '@lib/scripts/script.types';
import logger from '@lib/util/logger';
import chalk from 'chalk';

const runCommand = defineCommand({
  name: 'run',
  description: 'Runs a script by name.',
  positionalArgs: [
    { name: 'script', type: 'string', required: true, description: 'The script to run.' },
  ],
  options: [
    { name: 'list', aliases: ['l'], type: 'boolean', default: false, description: 'Lists all available scripts.', standalone: true },
  ],
  advancedConfig: {
    ignoreMaxPositionalArgs: true, // allow passing extra args to scripts without arg parser complaining about too many positionals
  },
  async run(ctx) {
    if (ctx.options.list) {
      printAvailableScripts();
      return;
    }

    const scriptName = ctx.positionalArgs.script;
    const script = getScript(scriptName);
    if (!script) {
      logger.error(`Script '${chalk.bold(scriptName)}' not found.`);
      logger.np.log();
      printAvailableScripts();
      process.exitCode = 1;
      return;
    }

    const input = resolveScriptInput(script, ctx.rawArgs);
    const scriptCtx = createScriptContext(script, input);
    await script.run(scriptCtx);
  },
});

export default runCommand;

// === Helpers ==================================================

/**
 * Maps remaining rawArgs (after the script name) to the script's typed input.
 * Supports `--name value`, `--name=value`, and positional mapping by definition order.
 */
function resolveScriptInput(script: Script, rawArgs: string[]): Record<string, unknown> {
  const defs: readonly ScriptInputDef[] = script.input ?? [];
  const input: Record<string, unknown> = {};

  // rawArgs from the run command: ['scriptName', ...rest]
  // The first positional was already consumed as the script name by the arg parser,
  // but rawArgs still contains the full argv after "run".
  // We skip the first element (script name) and parse the rest.
  const args = rawArgs.slice(1);
  const positionalQueue: string[] = [];
  let i = 0;

  while (i < args.length) {
    const token = args[i];

    if (token === '--') {
      i++;
      while (i < args.length) positionalQueue.push(args[i++]);
      break;
    }

    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      const name = eqIdx >= 0 ? token.slice(2, eqIdx) : token.slice(2);
      const value = eqIdx >= 0 ? token.slice(eqIdx + 1) : args[++i];
      const def = defs.find(d => d.name === name);
      if (def) {
        input[def.name] = coerce(value, def.type);
      }
      i++;
      continue;
    }

    positionalQueue.push(token);
    i++;
  }

  // Assign positionals by definition order
  const positionalDefs = defs.filter(d => !(d.name in input));
  for (let j = 0; j < positionalDefs.length && j < positionalQueue.length; j++) {
    input[positionalDefs[j].name] = coerce(positionalQueue[j], positionalDefs[j].type);
  }

  // Apply defaults
  for (const def of defs) {
    if (!(def.name in input) && def.default !== undefined) {
      input[def.name] = def.default;
    }
  }

  return input;
}

function coerce(value: string | undefined, type: string): unknown {
  if (value === undefined) return undefined;
  switch (type) {
    case 'number': return Number(value);
    case 'boolean': return value === 'true' || value === '1' || value === 'yes';
    default: return value;
  }
}

function printAvailableScripts() {
  const scripts = getAllScripts();
  if (scripts.length === 0) {
    logger.log(chalk.dim('No scripts registered.'));
    return;
  }
  logger.log(`${chalk.bold('Available scripts')}:`);
  const nameWidth = scripts.reduce((max, s) => Math.max(max, s.name.length), 0) + 2;
  for (const script of scripts) {
    logger.indent.log(`${chalk.cyan(script.name.padEnd(nameWidth))}${script.description ?? ''}`);
  }
}
