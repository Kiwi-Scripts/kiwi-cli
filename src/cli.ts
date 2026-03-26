#!/usr/bin/env node --no-deprecation

import { loadCommands } from '@lib/commands/command.loader';
import { loadConfig } from '@lib/config/config.loader';
import { dispatch, parseArgv } from '@lib/core/dispatcher';
import { CliError } from '@lib/errors/cli.error';
import fsTree from '@lib/util/fs-tree';
import { globalFlags } from '@lib/util/global-flags';
import logger from '@lib/util/logger';
import { suppressDEP0190 } from '@lib/util/node-patch';
import chalk from 'chalk';
suppressDEP0190(); // suppress deprecation warning for passing arguments to a shell sub-process

const {command, args} = parseArgv(process.argv);

const config = await loadConfig();
await loadCommands();

try {
  await dispatch(command, args, config);
} catch (error) {
  if (error instanceof CliError) {
    error.handle();
  }
  logger.np.log();
  logger.error(`${chalk.bold('Unexpected Error')}: ${(error as Error).message}`);
  if (logger.shouldLog('debug') && (error as Error).stack) {
    logger.error(chalk.dim((error as Error).stack!));
  }
  logger.np.log();
  process.exit(1);
}

if (globalFlags.dryRun) {
  fsTree.logSummary();
}