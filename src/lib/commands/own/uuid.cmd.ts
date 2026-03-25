import { defineCommand } from '@lib/commands/command.types';
import { copyToClipboard } from '@lib/util/clipboard-helper';
import logger from '@lib/util/logger';
import chalk from 'chalk';
import { v4, v5, v7 } from 'uuid';

const UUID_VERSIONS = [4, 5, 7];

const uuidCommand = defineCommand({
  name: 'uuid',
  description: 'Generates a uuid.',
  positionalArgs: [
    {name: 'namespace', type: 'string', description: 'Namespace attribute for v5 generation.'},
    {name: 'name', type: 'string', description: 'Name attribute for v5 generation.'},
  ],
  options: [
    {name: 'version', aliases: ['v'], type: 'number', description: `Specify a UUID version. Valid versions are: [${UUID_VERSIONS.join(', ')}]`, default: 7}
  ],
  async run(ctx) {
    const version = ctx.options.version;
    if (version === 4) {
      return await printUUID(v4());
    }
    if (version === 5) {
      if (!ctx.positionalArgs.namespace) throw new Error(`The 'namespace' arg needs to be defined for v5.`);
      if (!ctx.positionalArgs.name) throw new Error(`The 'name' arg needs to be defined for v5.`);
      return await printUUID(v5(ctx.positionalArgs.namespace, ctx.positionalArgs.name));
    }
    if (version === 7) {
      return await printUUID(v7());
    }
    throw new Error(`Invalid UUID version: ${version}`);
  },
})
export default uuidCommand;

async function printUUID(uuid: string) {
  logger.log('Generated UUID:', uuid);
  if (await copyToClipboard(uuid)) logger.log(`${chalk.green('Successfully')} copied to clipboard.`);
}