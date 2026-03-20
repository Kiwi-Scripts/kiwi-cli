export function suppressDEP0190() {
  const originalEmit = process.emit;
  process.emit = function (event: string, ...args: any[]) {
    if (event === 'warning' && (args[0] as any)?.code === 'DEP0190') {
      return false;
    }
    return originalEmit.apply(process, [event, ...args] as any);
  } as typeof process.emit;
}