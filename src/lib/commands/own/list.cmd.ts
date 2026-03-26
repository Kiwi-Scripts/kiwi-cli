import { getCommandAliases, getCommandsBySource } from '@lib/commands/command.registry';
import { Command, defineCommand } from '@lib/commands/command.types';
import { KiwiConfig } from '@lib/config/config.types';
import { resolveAssociation } from '@lib/core/dispatcher';
import logger from '@lib/util/logger';
import chalk from 'chalk';

const listCommand = defineCommand({
  name: 'list',
  alias: 'ls',
  description: 'Lists all registered commands and aliases.',
  run(ctx) {
    logger.np.log();

    printCommandGroup('Built-in', getCommandsBySource('builtin'));
    printCommandGroup('User (global)', getCommandsBySource('user-global'));
    printCommandGroup('User (local)', getCommandsBySource('user-local'));

    printAliases(ctx.config, getCommandAliases());

    logger.np.log();
  },
});

export default listCommand;

// === Helpers ==================================================

interface AliasInfo {
  alias: string;
  command: string;
  source: 'command' | 'config';
  targetCli?: string;
  conflict?: boolean;
}

function printCommandGroup(title: string, commands: Command[]) {
  logger.log(`${chalk.bold(title)} commands:`);
  if (commands.length === 0) {
    logger.indent.log(chalk.dim('(none)'));
  } else {
    const nameWidth = commands.reduce((max, cmd) => Math.max(max, cmd.name.length), 0) + 2;
    for (const cmd of commands) {
      const alias = cmd.alias ? chalk.dim(` (${cmd.alias})`) : '';
      logger.indent.log(`${chalk.cyan(cmd.name.padEnd(nameWidth))}${cmd.description ?? ''}${alias}`);
    }
  }
  logger.np.log();
}

function printAliases(
  config: KiwiConfig,
  commandAliases: ReadonlyMap<string, string>,
) {
  const hasCommandAliases = commandAliases.size > 0;
  const configEntries = Object.entries(config.aliases ?? {});
  if (!hasCommandAliases && configEntries.length === 0) return;

  const allAliases: AliasInfo[] = [];

  for (const [alias, command] of commandAliases) {
    allAliases.push({ alias, command, source: 'command' });
  }
  for (const [alias, command] of configEntries) {
    const targetCli = resolveAssociation(command, config);
    const conflict = !targetCli;
    allAliases.push({ alias, command, targetCli, source: 'config', conflict });
  }

  markAliasConflicts(allAliases);

  const aliasWidth = allAliases.reduce((max, a) => Math.max(max, a.alias.length), 0) + 2;
  const targetCliWidth = allAliases.reduce((max, a) => Math.max(max, a.targetCli?.length ?? 0), 0) + 1;
  const commandWidth = allAliases.reduce((max, a) => Math.max(max, a.command.length), 0) + 1;

  logger.log(`${chalk.bold('Aliases')}:`);
  for (const { alias, targetCli, command, source, conflict } of allAliases) {
    logger.indent.log(
      `${(conflict ? chalk.red : chalk.cyan)(alias.padEnd(aliasWidth))}${chalk.dim('→')} ${chalk.dim(targetCli?.padEnd(targetCliWidth) ?? '')}${command.padEnd(commandWidth + (targetCli ? 0 : targetCliWidth))}${chalk.dim(`(${source})`)}`,
    );
  }
}

function markAliasConflicts(allAliases: AliasInfo[]) {
  const aliasCounts = new Map<string, number>();
  for (const { alias } of allAliases) {
    aliasCounts.set(alias, (aliasCounts.get(alias) ?? 0) + 1);
  }
  const conflicts = [...aliasCounts.entries()]
    .filter(([, count]) => count > 1)
    .flatMap(([alias]) => allAliases.filter(a => a.alias === alias));
  conflicts.forEach(c => c.conflict = true);
}
