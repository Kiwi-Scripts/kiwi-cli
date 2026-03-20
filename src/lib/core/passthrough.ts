import logger from '@lib/util/logger';
import { spawn } from 'node:child_process';

export function passthrough(targetCli: string, args: string[]): Promise<number> {
  logger.debug(`Attempting passthrough to CLI: '${targetCli}' with args:`, args);
  return new Promise((resolve, reject) => {
    const child = spawn(targetCli, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
      shell: true
    });

    child.on('close', code => {
      logger.debug('Passthrough process closed with code:', code);
      resolve(code ?? 1);
    });
    child.on('error', error => {
      logger.debug('Passthrough process encountered an error:', error);
      reject(error);
    });
  });
}