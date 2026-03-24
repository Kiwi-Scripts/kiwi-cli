export const tsTemplate = `import { defineCommand } from '@kiwi-js/cli';

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