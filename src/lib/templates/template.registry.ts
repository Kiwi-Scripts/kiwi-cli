export const tsCommandTemplate = `import { defineCommand } from '@kiwi-js/cli';

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

export const tsScriptTemplate = `import { defineScript } from '@kiwi-js/cli';

export default defineScript({
  name: 'template',
  description: 'My awesome script.',
  input: [
    { name: 'target', type: 'string', required: true, description: 'The build target.' },
    { name: 'verbose', type: 'boolean', default: false, description: 'Enable verbose output.' },
  ],
  async run(ctx) {
    // ctx.input is fully typed based on the input definitions above
    const target = ctx.input.target;   // string (required, always defined)
    const verbose = ctx.input.verbose; // boolean (has default, always defined)

    // Execute a command with inherited stdio (interactive)
    await ctx.exec('echo', ['Building', target]);

    // Or capture stdout/stderr for processing
    const result = await ctx.capture('echo', ['done']);
    console.log(result.stdout.trim());
  },
});`