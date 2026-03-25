export function stripAnsi(str: string): string {
  return str.replace(/\u001B\[[0-9;]*m/g, '');
}

export function displayLength(str: string): number {
  return stripAnsi(str).length;
}
