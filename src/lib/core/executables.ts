import { logger } from '@kiwi-js/cli/api';
import { CaptureResult, ExecutableOptions } from '@lib/util/types';
import { spawn } from 'node:child_process';
import rl from 'readline';

/**
 * Spawn a child process with inherited stdio (interactive).
 * Returns the exit code.
 */
export async function exec(command: string, args: string[] = [], options: ExecutableOptions = {}): Promise<number> {
  const {cwd = process.cwd()} = options; 
  logger.debug(`[script:exec] ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd,
      env: process.env,
      shell: true,
    });
    child.on('close', code => resolve(code ?? 1));
    child.on('error', reject);
  });
}

/**
 * Spawn a child process and capture stdout/stderr.
 */
export async function capture(command: string, args: string[] = [], options: ExecutableOptions = {}): Promise<CaptureResult> {
  const {cwd = process.cwd()} = options; 
  logger.debug(`[script:capture] ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd,
      env: process.env,
      shell: true,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('close', code => resolve({ exitCode: code ?? 1, stdout, stderr }));
    child.on('error', reject);
  });
}

export async function prompt(message: string, defaultValue?: string): Promise<string> {
  logger.debug(`[script:prompt] ${message} (default: ${defaultValue})`);
  return new Promise((resolve) => {
    const promptMsg = defaultValue ? `${message} (${defaultValue}): ` : `${message}: `;
    const rlInterface = rl.createInterface({ input: process.stdin, output: process.stdout });
    rlInterface.question(promptMsg, answer => {
      resolve(answer || defaultValue || '');
      rlInterface.close();
    });
  });
}
