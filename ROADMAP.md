# 🥝 Kiwi-CLI Roadmap

A CLI tool that adds a custom scripting layer to existing CLI workflows, redirecting unhandled commands to the target 3rd-party CLI (e.g. `git`, `ng`) with full interactivity.

---

## Phase 1 — Foundation (MVP)

Core dispatch loop: parse input, match against known commands, passthrough everything else.

- [x] **CLI entry & arg extraction:** Strip binary name, extract command + rest args without a heavy arg parser
- [x] **Config loader:** Discover and load `kiwi.config.ts` (or `.js` / `.json`) from project root
- [x] **Dispatcher:** Central router: command name → handler lookup → passthrough fallback
- [x] **Passthrough with interactivity:** `child_process.spawn` with `stdio: 'inherit'`, exit code forwarding
- [x] **Built-in commands:** `help`, `version`, `init`
  - [x] *health*
  - [x] *help*
  - [x] *init*
  - [x] *version*
- [x] **Exit code propagation:** Forward child process exit code as kiwi's own

## Phase 2 — Script Engine

User-defined commands via `.kiwi/scripts/` directory with TypeScript support.

- [x] **`defineCommand()` API:** Typed helper for declaring commands with name, description, args schema, and handler
- [ ] **Script loader:** Dynamic import of `.kiwi/scripts/*.ts` at startup (via `jiti` or `tsx`)
- [ ] **Execution context:** `ctx.exec()` (interactive), `ctx.capture()` (piped), `ctx.confirm()` (prompts)
- [ ] **Command registry:** Collects built-in + user commands, warns on name collisions
- [ ] **`kiwi list`:** Show all registered commands and their source (built-in / user script)

## Phase 3 — Developer Experience

Polish, error handling, and quality-of-life features.

- [ ] **`kiwi init` scaffolding:** Generate `kiwi.config.ts` + `.kiwi/scripts/` directory with example script
- [ ] **Pretty error output:** Catch script errors, display context, suggest fixes
- [ ] **`--dry-run` flag:** Print commands that would execute without running them
- [x] **`--verbose` flag:** Show dispatcher decisions, config loading, script discovery
- [x] **Structured logging:** Prefixed, leveled output (`log`, `warn`, `error`) via context logger
- [x] **Command associations:** Configure default mappings for commands and their targeted cli (`fetch` -> `git`)\
If a command can be handled by a script, but not in all cases, it gets redirected to the correct cli as a fallback.

## Phase 4 — Expansion

Optional features for power users and advanced workflows.

- [ ] **Hooks / lifecycle:** `pre:<command>` and `post:<command>` hooks around any command
- [x] **Aliases:** Shorthand mappings in config (`c → commit`, `s → status`)
- [ ] **Shared script packages:** npm packages that export kiwi commands (plugin system)
- [ ] **Shell completions:** Generate completion scripts for bash, zsh, PowerShell
- [ ] **Pipeline chains:** Sequential script execution with typed inter-script data passing

---

## Architecture Overview

```txt
kiwi <command> [args...]
      │
      ├─ known command?  →  run kiwi handler (built-in or user script)
      └─ unknown?        →  passthrough to target CLI (stdio: inherit)
```

### Key Components

| Component | Responsibility |
| --- | --- |
| **Dispatcher** | Routes command name to handler or passthrough |
| **Passthrough** | Spawns target CLI with inherited stdio for full interactivity |
| **Config Loader** | Discovers `kiwi.config.*` from project root |
| **Script Loader** | Dynamically imports user scripts from configured directory |
| **Context** | Per-invocation state bag (cwd, paths, config, exec helpers) |
| **Command Registry** | Collects and deduplicates all command sources |

### Design Principles

- **Passthrough-first:** Unknown input goes straight to the target CLI, unmodified
- **Interactivity preserved:** `stdio: 'inherit'` keeps TTY features (prompts, colors, pagers) alive
- **Minimal arg parsing:** Only the first positional is extracted as command name; rest is passed raw
- **TypeScript-native scripts:** User scripts are `.ts` files, loaded at runtime without a compile step
- **Zero config to start:** Works as a pure passthrough wrapper with no config file required
