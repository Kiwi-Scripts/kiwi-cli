import { defineCommand } from '@lib/commands/command.types';
import { loadTemplates } from '@lib/templates/template.loader';
import logger from '@lib/util/logger';
import { kiwiPaths, kiwiPathsGlobal } from '@lib/util/paths';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

const initCommand = defineCommand({
  name: 'init',
  description: 'Initializies ".kiwi/scripts" directory with examples.',
  options: [
    { name: 'global', aliases: ['g'], type: 'boolean', default: false, description: 'Changes the target directory from the project root to the user home.' },
    { name: 'dry-run', aliases: ['d'], type: 'boolean', default: false, description: 'Simulates file creation without any actual changes.'}
  ],
  async run(ctx) {
    const targetDir = ctx.options.global ? kiwiPathsGlobal.userHome : kiwiPaths.projectRoot;
    const dry = ctx.options['dry-run'];
    const resultDir = path.join(targetDir, '.kiwi', 'commands');
    if (!dry) fs.mkdirSync(resultDir, {recursive: true});
    logger.log(`${chalk.green('[CREATE]')} dir: '${resultDir}'`);

    const tsTemplateFile = path.join(resultDir, 'template.command.ts');
    const { tsTemplate } = await loadTemplates();
    if (!dry) fs.writeFileSync(tsTemplateFile, tsTemplate, 'utf-8');
    logger.log(`${chalk.green('[CREATE]')} file: 'template.command.ts' in '${resultDir}'`);
    if (dry) logger.log(`Due to the ${chalk.green('--dry-run')} option no files were created.`);
  },
});
export default initCommand;
