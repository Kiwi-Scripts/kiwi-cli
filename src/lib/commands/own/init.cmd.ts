import { defineCommand } from '@lib/commands/command.types';
import { loadTemplates } from '@lib/templates/template.loader';
import fsTree from '@lib/util/fs-tree';
import { kiwiPaths, kiwiPathsGlobal } from '@lib/util/paths';
import path from 'node:path';

const initCommand = defineCommand({
  name: 'init',
  description: 'Initializes ".kiwi/*" directories with examples.',
  options: [
    { name: 'global', aliases: ['g'], type: 'boolean', default: false, description: 'Changes the target directory from the project root to the user home.' },
  ],
  async run(ctx) {
    const targetDir = ctx.options.global ? kiwiPathsGlobal.userHome : kiwiPaths.projectRoot;
    const resultDir = path.join(targetDir, '.kiwi', 'commands');

    fsTree.createDir(resultDir);

    const { tsTemplate } = await loadTemplates();
    fsTree.writeFile(path.join(resultDir, 'template.command.ts'), tsTemplate);
  },
});
export default initCommand;
