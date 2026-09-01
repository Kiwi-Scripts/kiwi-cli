import { defineScript } from '@kiwi-js/cli';
import { logger } from '@kiwi-js/cli/api';

const confirmYesNoScript = defineScript({
  name: 'confirmYesNo',
  description: 'Prompts the user to confirm an action with yes/no.',
  input: [
    { name: 'message', type: 'string', description: 'The confirmation message to display.', default: 'Are you sure?' },
    { name: 'default', type: 'boolean', default: false, description: 'The default value if the user just presses Enter.' },
  ],
  async run(ctx) {
    const { message, default: defaultValue } = ctx.input;
    const promptMessage = `${message} (${defaultValue ? 'Y/n' : 'y/N'})`;
    const answer = await ctx.prompt(promptMessage);
    logger.debug(`User input: '${answer}' (default: ${defaultValue})`);
    const normalized = answer.trim().toLowerCase();
    return normalized === 'y' || (normalized === '' && defaultValue);
  }
});
export default confirmYesNoScript;