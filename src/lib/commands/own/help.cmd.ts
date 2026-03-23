
import { getAllCommands, getCommand, isKnownCommand } from '@lib/commands/command.registry';
import { Command, defineCommand, OptionDef, PositionalArgDef } from '@lib/commands/command.types';
import logger from '@lib/util/logger';
import chalk from 'chalk';

const MAX_COL_WIDTH = Math.min(process.stdout.columns ?? Infinity, 120);


const helpCommand = defineCommand({
  name: 'help',
  description: 'Show the help for a specific command or list available commands.',
  positionalArgs: [
    { name: 'command', type: 'string', description: 'The command to show help for', required: false },
    { name: 'argument', type: 'string', description: 'The argument to show help for', required: false }
  ],
  run(ctx) {
    const commandName = ctx.positionalArgs.command;
    if (!commandName) {
      logger.debug('No command specified. Showing general help and available commands.');
      printAllCommands();
      return;
    }
    if (!isKnownCommand(commandName)) {
      logger.error(`Unknown command: "${commandName}"`);
      logger.log('Use "kiwi help" to see the list of available commands.');
      logger.np.log();
      return;
    }

    const command = getCommand(commandName);
    const argumentName = ctx.positionalArgs.argument;
    printUsage(command, argumentName);
  }
});

export default helpCommand;

// helpers

function printAllCommands() {
  logger.log('Available Commands:');
  logger.log();

  const commands = getAllCommands();
  const nameColumnWidth = commands.reduce((longest, command) => Math.max(longest, command.name.length), 0) + 2;
  logger.indent().log(`${'Command:'.padEnd(nameColumnWidth)} - Description:`);
  for (const command of commands) {
    logger.indent().log(`${command.name.padEnd(nameColumnWidth)} - ${command.description}`);
  }
}


/**
 * Print usage for a command, optionally narrowed to a single attribute.
 */
function printUsage(command: Command, attributeName?: string): void {
  if (attributeName) {
    printAttributeDetail(command, attributeName);
    return;
  }

  printFullUsage(command);
}

// === Full Usage ===============================================

function printFullUsage(command: Command): void {
  const positionalDefs = command.positionalArgs ?? [];
  const optionDefs = command.options ?? [];

  // Header
  logger.np.log();
  logger.log(`${command.name}${command.description ? ` - ${command.description}` : ''}`);

  // Usage line
  const usageParts = ['$', chalk.yellow('kiwi'), command.name];
  for (const arg of positionalDefs) {
    usageParts.push(chalk.cyan(arg.required ? (`<${arg.name}>`) : `[${arg.name}]`));
  }
  if (optionDefs.length > 0) {
    usageParts.push(chalk.green('[options]'));
  }

  logger.log();
  logger.log(chalk.yellow('Usage:'));
  logger.log(usageParts.join(' '));

  const COL_WIDTHS = calcColumnWidths(command);

  // Positional args
  if (positionalDefs.length > 0) {
    logger.log();
    logger.log(chalk.cyan('Arguments:'));
    for (const arg of positionalDefs) {
      printArgEntry(arg, COL_WIDTHS);
    }
  }

  // Options
  if (optionDefs.length > 0) {
    logger.log();
    logger.log(chalk.green('Options:'));
    for (const opt of optionDefs) {
      printOptionEntry(opt, COL_WIDTHS);
    }
  }

  logger.np.log();
}

// === Single Attribute Detail ==================================

function printAttributeDetail(command: Command, name: string): void {
  // Normalize: strip leading dashes so "--dry-run", "-d", and "dry-run" all match
  const normalized = name.replace(/^-{1,2}/, '');

  const positional = (command.positionalArgs ?? []).find(a => a.name === normalized);
  const option = (command.options ?? []).find(
    o => o.name === normalized || o.aliases?.includes(normalized),
  );

  if (!positional && !option) {
    logger.error(`Unknown attribute "${name}" for command "${command.name}"`);
    logger.log();
    logger.log('Available attributes:');
    for (const a of command.positionalArgs ?? []) {
      logger.indent().log(a.name);
    }
    for (const o of command.options ?? []) {
      logger.indent().log(`--${o.name}`);
    }
    logger.np.log();
    return;
  }

  logger.np.log();

  const COL_WIDTHS = calcColumnWidths(command);

  if (positional) {
    logger.log(`${command.name} - argument: ${chalk.cyan(positional.name)}`);
    logger.log();
    printArgEntry(positional, COL_WIDTHS);
  }

  if (option) {
    logger.log(`${command.name} - option: --${chalk.green(option.name)}`);
    logger.log();
    printOptionEntry(option, COL_WIDTHS);
  }

  logger.np.log();
}

// === Entry Formatters =========================================

function printArgEntry(arg: PositionalArgDef, colWidths: ColumnWidths): void {
  const names = arg.name.padEnd(colWidths.name);
  const type = formatType(arg.type);
  const req = arg.required ? chalk.yellow('*') : colWidths.req ? ' ' : undefined; // only add space if req column exists to keep alignment
  const label = [names, type, req].join(' ').trimEnd();
  const desc = formatDesc(colWidths, arg.description, arg.default);

  logger.ml.indent().log(`${label}  ${desc}`);
}

function printOptionEntry(opt: OptionDef, colWidths: ColumnWidths): void {
  const names = formatOptionNames(opt).padEnd(colWidths.name);
  const type = formatType(opt.type);
  const req = opt.required ? chalk.yellow('*') : colWidths.req ? ' ' : undefined; // only add space if req column exists to keep alignment
  const label = [names, type, req].join(' ').trimEnd();
  const desc = formatDesc(colWidths, opt.description, opt.default);

  logger.ml.indent().log(`${label}  ${desc}`);
}

function formatOptionNames(option: OptionDef): string {
  const aliases = formatOptionAliases(option);
  return aliases ? `--${option.name}, ${aliases}` : `--${option.name}`;
}

function formatOptionAliases(option: OptionDef): string {
  return option.aliases?.map(a => a.length > 1 ? `--${a}` : `-${a}`).join(', ') ?? '';
}

function formatType(type: 'string' | 'number' | 'boolean'): string {
  switch (type) {
    case 'string': return chalk.yellow('[str ]');
    case 'number': return chalk.yellow('[num ]');
    case 'boolean': return chalk.yellow('[bool]');
  }
}

function formatDesc(colWidths: ColumnWidths, desc: string = '', defaultValue: string | number | boolean | undefined): string {
  if (!desc && !defaultValue) return '';
  const descWidth = colWidths.desc;
  if (!desc) return formatDefault(defaultValue).padStart(descWidth);
  const wrapped = wrapText(desc, descWidth);
  const defaultStr = formatDefault(defaultValue);
  const defaultStrLength = defaultStr.length - 16; // exclude chalk dim formatting from length calculation
  const columnOffsetWidth = colWidths.label;
  const indent = '-'.repeat(columnOffsetWidth);
  const lastLine = wrapped.pop()!;
  const formattedLastLine = lastLine.length + defaultStrLength > descWidth
    ? `${lastLine}\n${indent}${defaultStr.padStart(descWidth)}`
    : `${lastLine.padEnd(descWidth - defaultStrLength)}${defaultStr}`;
  return [...wrapped, formattedLastLine].join('\n' + indent);
}

function formatDefault(value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  const prefix = 'Default: ';
  const display = typeof value === 'string' ? `"${value}"` : String(value);
  return chalk.dim(` [${prefix}${display}]`);
}

function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}

interface ColumnWidths {
  name: number;
  type: number;
  req: number;
  label: number;
  desc: number;
}

function calcColumnWidths(command: Command): ColumnWidths {
  const positionalDefs = command.positionalArgs ?? [];
  const optionDefs = command.options ?? [];
  const name = calcNameMinColumnWidth(positionalDefs, optionDefs);
  const type = 7; // "[type]"
  const req = optionDefs.some(def => def.required) || positionalDefs.some(arg => arg.required) ? 2 : 0; // "*" if any required
  const label = name + 1 + type + req + 1; // +1 for spaces between columns
  const desc = calcDescMaxColWidth(label);
  return { name, type, req, label, desc };
}

function calcDescMaxColWidth(labelColWidth: number): number {
  const loggerPrefixLength = logger.prefix.length + 1; // +1 for space after prefix
  const padding = 2; // space between columns
  return Math.max(40, MAX_COL_WIDTH - loggerPrefixLength - labelColWidth);
}

function calcNameMinColumnWidth(args: PositionalArgDef[], options: OptionDef[]): number {
  const argWidth = args.reduce((max, arg) => Math.max(max, arg.name.length), 0);
  const optWidth = options.reduce((max, opt) => {
    const names = formatOptionNames(opt);
    return Math.max(max, names.length);
  }, 0);
  return Math.max(argWidth, optWidth);
}