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

    const commandsDir = path.join(targetDir, '.kiwi', 'commands');
    const scriptsDir = path.join(targetDir, '.kiwi', 'scripts');

    fsTree.createDir(commandsDir);
    fsTree.createDir(scriptsDir);

    const { tsCommandTemplate, tsScriptTemplate } = await loadTemplates();
    fsTree.writeFile(path.join(commandsDir, 'template.command.ts'), tsCommandTemplate);
    fsTree.writeFile(path.join(scriptsDir, 'template.script.ts'), tsScriptTemplate);
  },
});
export default initCommand;
