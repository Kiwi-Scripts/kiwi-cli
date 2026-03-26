import { CaptureResult, Script, ScriptContext } from '@lib/scripts/script.types';
import logger from '@lib/util/logger';
import { spawn } from 'node:child_process';
import rl from 'readline';

/**
 * Creates a fully hydrated ScriptContext for a given script and input map.
 */
export function createScriptContext(script: Script, input: Record<string, unknown>): ScriptContext {
  return {
    scriptName: script.name,
    input: input as ScriptContext['input'],
    exec,
    capture,
    prompt,
  };
}

/**
 * Spawn a child process with inherited stdio (interactive).
 * Returns the exit code.
 */
function exec(command: string, args: string[] = []): Promise<number> {
  logger.debug(`[script:exec] ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
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
function capture(command: string, args: string[] = []): Promise<CaptureResult> {
  logger.debug(`[script:capture] ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd(),
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

function prompt(message: string, defaultValue?: string): Promise<string> {
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
