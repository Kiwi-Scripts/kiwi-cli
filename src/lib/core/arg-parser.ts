import { Command, CommandContext, OptionDef } from '@lib/commands/command.types';
import { ArgParseError } from '@lib/errors/arg-parser.error';

interface ParsedOptionToken {
  name: string;
  value: string | undefined;
}

/**
 * Parses command-line arguments for a given command.
 * Handles positional arguments, options (long and short), boolean flags, and applies default values.
 * 
 * Supports:
 * ```bash
 * --name value               → long option with separate value
 * --name=value               → long option with inline value
 * -n value                   → short option with separate value
 * -n=value                   → short option with inline value
 * --flag                     → boolean flag (true if present)
 * --flag [true|1|yes]        → boolean flag with explicit truthy value
 * --flag [false|0|no]        → boolean flag with explicit falsy value
 * -abc                       → cluster of short boolean flags (e.g. -a -b -c)
 * -abc [val]                 → cluster of short boolean flags + regular option/shortflag (e.g. -a -b -c [val])
 * positional1 positional2    → positional arguments
 * --                         → end of options, rest are positional
 * pos1 --opt val pos2 -- -hi → mixed positional and options (-hi is treated as positional due to '--' separator)
 * ```
 * 
 * @param command The command definition.
 * @param rawArgs The raw arguments from the command line.
 * @returns An object containing parsed positional arguments and options.
 * @throws ArgParseError for any parsing or validation issues.
 */
export function parseCommandArgs(command: Command, rawArgs: string[]): { positionalArgs: CommandContext['positionalArgs']; options: CommandContext['options'] } {
  return new ArgParser(command, rawArgs).parse();
}

class ArgParser {
  readonly positionalDefs;
  readonly optionDefs;

  readonly positionalValues: string[] = [];
  readonly positionalArgs: Record<string, string | number | boolean> = {};
  readonly options: Record<string, string | number | boolean> = {};

  // Build lookup maps for options
  readonly optionByName = new Map<string, OptionDef>();
  readonly optionByAlias = new Map<string, OptionDef>();

  private pointer = 0;

  constructor(private readonly command: Command, private readonly rawArgs: string[]) {
    this.positionalDefs = this.command.positionalArgs ?? [];
    this.optionDefs = this.command.options ?? [];

    for (const def of this.optionDefs) {
      this.optionByName.set(def.name, def);
      if (def.aliases) {
        def.aliases.forEach(alias => this.optionByAlias.set(alias, def));
      }
    }
  }

  parse() {
    this.extractOptionsAndPositionals();
    this.parsePositionalArgs();
    this.validateRequiredOptions();
    return {
      positionalArgs: this.positionalArgs,
      options: this.options
    };
  }

  private extractOptionsAndPositionals() {
    while (this.pointer < this.rawArgs.length) {
      const token = this.rawArgs[this.pointer];

      // -- stops option parsing, rest is positional
      if (token === '--') {
        this.pointer++;
        while (this.pointer < this.rawArgs.length) {
          this.positionalValues.push(this.rawArgs[this.pointer++]);
        }
        break;
      }

      // Option (e.g. --name)
      if (token.startsWith('--')) {
        this.parseOption(token);
        this.pointer++;
        continue;
      }

      // Short flag (e.g. -n)
      if (token.startsWith('-') && token.length > 1 && !this.isNumericString(token)) {
        this.parseShortFlags(token);
        this.pointer++;
        continue;
      }

      // Positional argument
      this.positionalValues.push(token);
      this.pointer++;
    }
  }

  private parseOption(token: string) {
    const { name, value } = this.splitOptionToken(token);
    const def = this.optionByName.get(name) || this.optionByAlias.get(name);

    if (!def) {
      this.fail(`Unknown option: --${name}`);
    }

    this.options[def.name] = this.parseOptionDef(def, value);
  }

  private parseShortFlags(token: string) {
    const { name, value } = this.splitOptionToken(token);
    const flags = name.split('');
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      const def = this.optionByAlias.get(flag);

      if (!def) {
        this.fail(`Unknown option: -${flag}`);
      }

      if (i !== flags.length - 1) {
        if (def.type !== 'boolean') {
          this.fail(`Option -${flag} must be a boolean to be used in a cluster`);
        }
        this.options[def.name] = true;
        continue;
      }

      // last flag is treated as regular option
      this.options[def.name] = this.parseOptionDef(def, value);
    }
  }

  private parseOptionDef(def: OptionDef, value: string | undefined): string | number | boolean {
    if (def.type === 'boolean') {
      if (value !== undefined) {
        return this.parseBooleanValue(value) ?? this.fail(`Invalid boolean value for --${def.name}: ${value}`);
      }
      // check the next arg for boolean value (e.g. --flag true/false) -> no result implies true (e.g. --flag)
      const rawBoolean = this.parseBooleanValue(this.rawArgs[++this.pointer]);
      return rawBoolean ?? true;
    }

    const raw = value !== undefined ? value : this.rawArgs[++this.pointer];
    if (raw === undefined) {
      this.fail(`Option --${def.name} requires a value`);
    }
    return this.coerce(def.name, raw, def.type);
  }

  private parsePositionalArgs() {
    if (this.positionalValues.length > this.positionalDefs.length) {
      this.fail(`Too many positional arguments. Expected at most ${this.positionalDefs.length} but got ${this.positionalValues.length}`);
    }
    for (let i = 0; i < this.positionalDefs.length; i++) {
      const def = this.positionalDefs[i];
      const raw = this.positionalValues[i];

      if (raw !== undefined) {
        this.positionalArgs[def.name] = this.coerce(def.name, raw, def.type);
      } else if (def.default !== undefined) {
        this.positionalArgs[def.name] = def.default;
      } else if (def.required) {
        this.fail(`Missing required positional argument: <${def.name}> (Pos: ${i + 1})`);
      }
    }
  }

  private validateRequiredOptions() {
    for (const def of this.optionDefs) {
      if (this.options[def.name] !== undefined) {
        continue; // option is present, no need to check
      }

      if (def.default !== undefined) {
        this.options[def.name] = def.default; // apply default value
      } else if (def.required) {
        this.fail(`Missing required option: --${def.name}`);
      }
    }
  }

  private fail(message: string): never {
    throw new ArgParseError(message, this.command);
  }
  
  private coerce(name: string, raw: string, type: 'string' | 'number' | 'boolean'): string | number | boolean {
    switch (type) {
      case 'string':
        return raw;
      case 'number': {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          this.fail(`Expected a number for "${name}", got: "${raw}"`);
        }
        return num;
      }
      case 'boolean':
        return this.parseBooleanValue(raw) ?? this.fail(`Expected a boolean for "${name}", got: "${raw}"`);
    }
  }
  
  private parseBooleanValue(raw: string | undefined): boolean | undefined {
    if (raw === undefined) {
      return undefined;
    }
    switch (raw.toLowerCase()) {
      case 'true':
      case '1':
      case 'yes':
        return true;
      case 'false':
      case '0':
      case 'no':
        return false;
      default:
        return undefined;
    }
  }
  
  private isNumericString(value: string): boolean {
    return /^-\d/.test(value);
  }
  
  /**
   * Split an option token into name and optional inline value.
   * Only the first `=` is treated as separator.
   *
   * Examples:
   * ```
   *   --name          → { name: 'name',     value: undefined }
   *   --name=value    → { name: 'name',     value: 'value' }
   *   --equation=1=2  → { name: 'equation', value: '1=2' }
   *   -n=value        → { name: 'n',        value: 'value' }
   *   -n              → { name: 'n',        value: undefined }
   * ```
   */
  private splitOptionToken(token: string): ParsedOptionToken {
    const match = token.match(/^--?([^=]+?)(?:=(.*))?$/);
    if (!match) {
      return { name: token, value: undefined };
    }
    return {
      name: match[1],
      value: match[2],   // undefined if no '=' present, '' if --name= (empty value)
    };
  }
}