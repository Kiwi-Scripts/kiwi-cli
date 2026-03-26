import confirmYesNoScript from '@lib/scripts/own/confirm.script';
import { Script } from '@lib/scripts/script.types';
import logger from '@lib/util/logger';

export type ScriptSource = 'builtin' | 'user-global' | 'user-local';

const scripts = new Map<string, Script>();
const scriptSources = new Map<string, ScriptSource>();

const ownScripts = [
  confirmYesNoScript
] as const;
ownScripts.forEach(script => registerScript(script, 'builtin'));

export function registerScript(script: Script, source: ScriptSource) {
  if (scripts.has(script.name)) {
    logger.warn(`Script '${script.name}' was registered before. Overwriting...`);
  }
  scripts.set(script.name, script);
  scriptSources.set(script.name, source);
}

export function getScript(name: string): Script | undefined {
  return scripts.get(name);
}

export function getAllScripts(): Script[] {
  return [...scripts.values()];
}

export function getScriptsBySource(source: ScriptSource): Script[] {
  return [...scripts.entries()]
    .filter(([name]) => scriptSources.get(name) === source)
    .map(([, script]) => script);
}
