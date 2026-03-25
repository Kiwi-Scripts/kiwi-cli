export function stripAnsi(str: string): string {
  return str.replace(/\u001B\[[0-9;]*m/g, '');
}

export function displayLength(str: string): number {
  return stripAnsi(str).length;
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}