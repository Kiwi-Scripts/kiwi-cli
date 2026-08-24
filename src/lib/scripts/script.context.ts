import { capture, exec, prompt } from '@lib/core/executables';
import { Script, ScriptContext } from '@lib/scripts/script.types';

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
