#!/usr/bin/env node --no-deprecation

import { dispatch, parseArgv } from '@lib/core/dispatcher';
import { suppressDEP0190 } from '@lib/util/node-patch';
suppressDEP0190();

const {command, args} = parseArgv(process.argv);
dispatch(command, args);