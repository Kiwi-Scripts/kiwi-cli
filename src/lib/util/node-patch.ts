export function suppressDEP0190() {
  process.removeAllListeners('warning');
  process.on('warning', warning => {
    if ((warning as any).code !== 'DEP0190') {
      process.emitWarning(warning);
    }
  });
}