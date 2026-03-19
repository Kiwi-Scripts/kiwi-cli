#!/usr/bin/env node --no-deprecation

import { loadConfig } from '@lib/config/config.loader';
import { dispatch, parseArgv } from '@lib/core/dispatcher';
import { suppressDEP0190 } from '@lib/util/node-patch';
suppressDEP0190();

const config = await loadConfig();

const {command, args} = parseArgv(process.argv);
dispatch(command, args, config);