#!/usr/bin/env node

import kiwiPaths from '@lib/util/paths';
import version from '@lib/version';
import chalk from 'chalk';

const prefix = chalk.magenta('[kiwi]');

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`${prefix} Version: ${version}`);
  console.log(`${prefix} Loc: ${kiwiPaths.cwd}`);
  process.exit(0);
}

console.log(`${prefix} The cli works!`);