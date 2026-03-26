# 🥝 Kiwi-CLI

A CLI tool that adds a custom scripting layer to existing CLI workflows. Write typed commands and scripts in TypeScript, and let Kiwi handle dispatch, argument parsing, and passthrough to external CLIs like `git` and `ng`.

> **Status:** *Alpha* - core features are stable but the API may still change before v1.0.

## Installation

```bash
npm i -g @kiwi-js/cli
```

Requires **Node.js ≥ 18**. TypeScript user scripts/commands/config require [`tsx`](https://github.com/privatenumber/tsx) (installed as an optional dependency).

## Quick Start

```bash
# Scaffold .kiwi/ directories with example command and script templates
kiwi init

# See all registered commands
kiwi list

# External mapped commands are passed through to the associated CLI
kiwi push origin main   # → git push origin main
kiwi serve              # → ng serve
```

## How It Works

```txt
kiwi <command> [args...]
      │
      ├─ known command?  →  run kiwi handler (built-in or user-defined)
      └─ unknown?        →  passthrough to associated CLI (interactive, full TTY)
```

**Kiwi** intercepts the first positional as a command name. If it matches a registered command (built-in or user-defined), Kiwi runs the handler. Otherwise, it resolves the command via configured **associations** and forwards the full invocation to the target CLI with `stdio: 'inherit'`, preserving colors, prompts, and pagers.

## Built-in Commands

| Command | Alias | Description |
| --- | --- | --- |
| `help` | | Show help for a specific command or list all commands. |
| `version` | | Print the current kiwi-cli version. |
| `health` | | Print the current status of the CLI. |
| `init` | | Scaffold `.kiwi/` directories with example templates. |
| `list` | `ls` | List all registered commands and aliases. |
| `run` | | Run a script by name. |
| `uuid` | | Generate a UUID (v4, v5, v7). |

## User Commands

Place `.command.ts` (or `.js`) files in `.kiwi/commands/` at your project root or home directory. Kiwi discovers and loads them automatically.

```typescript
// .kiwi/commands/greet.command.ts
import { defineCommand, logger } from '@kiwi-js/cli';

export default defineCommand({
  name: 'greet',
  description: 'Say hello.',
  positionalArgs: [
    { name: 'name', type: 'string', required: true, description: 'Who to greet.' }
  ],
  options: [
    { name: 'loud', aliases: ['l'], type: 'boolean', default: false, description: 'Uppercase output.' }
  ],
  run(ctx) {
    const msg = `Hello, ${ctx.positionalArgs.name}!`;
    logger.log(ctx.options.loud ? msg.toUpperCase() : msg);
  },
});
```

All `ctx.positionalArgs` and `ctx.options` are fully typed and inferred from the definitions.

**Load order:** Global (`~/.kiwi/commands/`) → Local (`.kiwi/commands/`). Local commands overwrite global ones with a warning.

## User Scripts

Scripts are reusable building blocks that commands (or other scripts) can compose. They receive typed input, have access to execution helpers, and can return typed output.

Place `.script.ts` (or `.js`) files in `.kiwi/scripts/`:

```typescript
// .kiwi/scripts/ensure-branch.script.ts
import { defineScript } from '@kiwi-js/cli';

export default defineScript({
  name: 'ensure-branch',
  description: 'Ensure a git branch exists, creating it if needed.',
  input: [
    { name: 'branch', type: 'string', required: true, description: 'Branch name.' }
  ],
  async run(ctx) {
    const result = await ctx.capture('git', ['branch', '--list', ctx.input.branch]);
    if (!result.stdout.trim()) {
      await ctx.exec('git', ['checkout', '-b', ctx.input.branch]);
      return true;
    }
    return false;
  },
});
```

### Script Context

Scripts receive a context with execution helpers:

| Method | Description |
| ------ | ----------- |
| `ctx.exec(cmd, args?)` | Spawn a process with inherited stdio (interactive). Returns exit code. |
| `ctx.capture(cmd, args?)` | Spawn a process and capture stdout/stderr. Returns `{ exitCode, stdout, stderr }`. |
| `ctx.prompt(message, default?)` | Prompt the user for a single line of input. |

### Running Scripts

Scripts can be invoked directly from the terminal:

```bash
kiwi run ensure-branch --branch feat/new
kiwi run --list   # list all available scripts
```

## Configuration

Create a `kiwi.config.ts` (or `.js`/`.json`) at your project root:

```typescript
import { defineConfig } from '@kiwi-js/cli';

export default defineConfig({
  // Map commands to target CLIs for passthrough
  associations: {
    git: ['fetch', 'push', 'pull', 'commit', 'status'],
    ng: ['generate', 'build', 'serve'],
  },

  // Shorthand aliases for commands
  aliases: {
    g: 'generate',
    s: 'serve',
  },

  // Custom path labels for use in scripts
  pathLabels: {
    '@src': 'src',
  },

  // Disable the built-in defaults if needed
  // disableDefaultAssociations: true,
  // disableDefaultAliases: true,
});
```

### Default Associations

Out of the box, Kiwi maps common commands to `git` and `ng` (Angular CLI). Use `disableDefaultAssociations: true` to start from a clean slate.

### Default Aliases

A handful of Angular shorthand aliases are included (`g` → `generate`, `b` → `build`, `s` → `serve`, `t` → `test`, `e` → `e2e`, `d` → `deploy`, `l` → `lint`). Use `disableDefaultAliases: true` to remove them.

## Global Flags

| Flag | Description |
| --- | --- |
| `--verbose` | Show debug output: dispatcher decisions, config loading, script discovery. |
| `--dry-run` | Print file operations that would be performed without executing them. |
| `--help` | Show help for the given command. |

## API Exports

When imported from `@kiwi-js/cli`, the following are available for use in commands and scripts:

```typescript
import {
  defineCommand,  // Typed command definition helper
  defineConfig,   // Typed config definition helper
  defineScript,   // Typed script definition helper
  logger,         // Structured logger (log, warn, error, debug)
  fsTree,         // File system abstraction (respects --dry-run)
  globalFlags,    // Access to --verbose, --dry-run state
} from '@kiwi-js/cli';
```

## License

[MIT](LICENCE)
