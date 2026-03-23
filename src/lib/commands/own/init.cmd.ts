import { defineCommand } from '@lib/commands/command.types';
import logger from '@lib/util/logger';
import { kiwiPaths, kiwiPathsGlobal } from '@lib/util/paths';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

const initCommand = defineCommand({
  name: 'init',
  description: 'Initializies ".kiwi/scripts" directory with examples.',
  alias: 'i',
  options: [
    { name: 'global', aliases: ['g'], type: 'boolean', default: false, description: 'Changes the target directory from the project root to the user home.' },
    { name: 'dry-run', aliases: ['d'], type: 'boolean', default: false, description: 'Simulates file creation without any actual changes.'}
  ],
  run(ctx) {
    const targetDir = ctx.options.global ? kiwiPathsGlobal.userHome : kiwiPaths.projectRoot;
    const dry = ctx.options['dry-run'];
    const resultDir = path.join(targetDir, '.kiwi', 'commands');
    if (!dry) fs.mkdirSync(resultDir, {recursive: true});
    logger.log(`${chalk.green('[CREATE]')} dir: '${resultDir}'`);

    const tsTemplateFile = path.join(resultDir, 'template.command.ts');
    if (!dry) fs.writeFileSync(tsTemplateFile, tsTemplate, 'utf-8');
    logger.log(`${chalk.green('[CREATE]')} file: 'template.command.ts' in '${resultDir}'`);
    if (dry) logger.log(`Due to the ${chalk.green('--dry-run')} option no files were created.`);
  },
});
export default initCommand;

const tsTemplate = `import { defineCommand } from '@kiwi-js/cli';

export default defineCommand({
  name: 'template',
  alias: 't',
  description: 'My awesome command.',
  options: [
    { name: 'opt', aliases: ['o'], description: 'Some option', type: 'number' },
    { name: 'defOpt', aliases: ['d'], description: 'Some option with default value', type: 'boolean', default: false }
  ],
  positionalArgs: [
    { name: 'pos1', description: 'A required positional arg', type: 'string', required: true }
  ],
  run(ctx) {
    // ctx contains all correctly typed options/positional arg defined above
    // if a value is required or has a default value, it is defined
    ctx.options.opt;         // optional, possibly undefined, 'number' typed  (both TS & JS)
    ctx.options.defOpt;      // default,  never undefined,    'boolean' typed      -"-
    ctx.positionalArgs.pos1; // required, never undefined,    'string' typed       -"-
    ctx.rawArgs;             // the raw argv input array (without bin entries)
  },
});`