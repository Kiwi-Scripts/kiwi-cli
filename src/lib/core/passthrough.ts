import { spawn } from 'node:child_process';

export function passthrough(targetCli: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(targetCli, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
      shell: true
    });

    child.on('close', code => resolve(code ?? 1));
    child.on('error', reject);
  });
}