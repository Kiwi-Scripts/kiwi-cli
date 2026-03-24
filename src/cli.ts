#!/usr/bin/env node --no-deprecation

import { loadCommands } from '@lib/commands/command.loader';
import { loadConfig } from '@lib/config/config.loader';
import { dispatch, parseArgv } from '@lib/core/dispatcher';
import { suppressDEP0190 } from '@lib/util/node-patch';
suppressDEP0190(); // suppress deprecation warning for passing arguments to a shell sub-process

const {command, args} = parseArgv(process.argv);

const config = await loadConfig();
await loadCommands();

dispatch(command, args, config);