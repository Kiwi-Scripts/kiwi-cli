import lazySingleton from '@lib/util/lazy-singleton';
import fs from 'node:fs';
import path from 'node:path';

export type PathLabels = Record<string, string>;

export interface PathResolverOptions {
  /**
   * Start directory for project root detection.
   * Defaults to process.cwd().
   */
  cwd?: string;

  /**
   * Additional files that can identify a project root.
   * package.json and angular.json are always checked.
   */
  rootMarkers?: string[];

  /**
   * Path labels / waypoints.
   * 
   * Example:
   * ```ts
   * {
   *   '@src': 'src',
   *   '@app': 'src/app'
   * }
   * ```
   * 
   * `@root` and `@cwd` are always defined by default.
   */
  labels?: PathLabels;

  /**
   * The default path label to use for relative paths.
   * Defaults to `@root`.
   */
  defaultBaseLabel?: string;

  /**
   * If `true`, requires the execution within a project directory. By default, if not project root is found, the resolver will throw.
   * For use outside of a project context, set this to `false` and the resolver will use the determined `cwd` as the root for relative paths.
   */
  requireProjectRoot?: boolean;
}

export interface ResolvePathOptions {
  /**
   * Base label used for unlabeled relative paths.
   * Defaults to `PathResolverOptions.defaultBaseLabel`.
   */
  baseLabel?: string;

  /**
   * If true, require the resolved path to exist.
   */
  mustExist?: boolean;
}

export class PathResolver {
  public readonly cwd: string;
  public readonly projectRoot: string;
  private readonly labels: Map<string, string>;
  private readonly defaultBaseLabel: string;

  constructor(options: PathResolverOptions = {}) {
    this.cwd = path.resolve(options.cwd ?? process.cwd());
    this.projectRoot = findProjectRoot(this.cwd, options.rootMarkers, options.requireProjectRoot ?? true);
    this.labels = new Map<string, string>();

    this.registerLabel('@cwd', this.cwd);
    this.registerLabel('@root', this.projectRoot);

    for (const [label, target] of Object.entries(options.labels ?? {})) {
      this.registerLabel(label, target);
    }

    this.defaultBaseLabel = options.defaultBaseLabel && assertValidLabel(options.defaultBaseLabel) ? options.defaultBaseLabel : '@root';
  }

  /**
   * Register a label.
   * Relative targets are resolved from project root.
   */
  registerLabel(label: string, targetPath: string): void {
    assertValidLabel(label);

    const absolute = path.isAbsolute(targetPath)
      ? path.resolve(targetPath)
      : path.resolve(this.projectRoot, targetPath);

    this.labels.set(label, absolute);
  }

  unregisterLabel(label: string): void {
    this.labels.delete(label);
  }

  hasLabel(label: string): boolean {
    return this.labels.has(label);
  }

  getLabelTarget(label: string): string | undefined {
    return this.labels.get(label);
  }

  listLabels(): Record<string, string> {
    return Object.fromEntries(
      [...this.labels.entries()].map(([label, absolutePath]) => [
        label,
        toPosixPath(path.relative(this.projectRoot, absolutePath)) || '.',
      ]),
    );
  }

  /**
   * Normalize external input into a predictable slash format.
   * Does not make it absolute by itself.
   */
  normalizeInput(inputPath: string | string[]): string {
    return normalizeExternalPath(inputPath);
  }

  /**
   * Resolve a path input into an absolute filesystem path.
   *
   * Supports:
   * - absolute paths
   * - relative paths
   * - labeled paths like @src/components/button
   */
  resolve(inputPath: string | string[], options: ResolvePathOptions = {}): string {
    const normalized = normalizeExternalPath(inputPath);

    let absolute: string;

    const labelMatch = matchLabelPrefix(normalized);
    if (labelMatch) {
      const { label, remainder } = labelMatch;
      const labelTarget = this.labels.get(label);

      if (!labelTarget) {
        throw new Error(`Unknown path label: ${label}`);
      }

      absolute = path.resolve(labelTarget, fromPosixPath(remainder));
    } else if (path.isAbsolute(normalized)) {
      absolute = path.resolve(normalized);
    } else {
      const baseLabel = options.baseLabel ?? this.defaultBaseLabel;
      const baseTarget = this.labels.get(baseLabel);

      if (!baseTarget) {
        throw new Error(`Unknown base label: ${baseLabel}`);
      }

      absolute = path.resolve(baseTarget, fromPosixPath(normalized));
    }

    if (options.mustExist && !fs.existsSync(absolute)) {
      throw new Error(`Resolved path does not exist: ${absolute}`);
    }

    return path.normalize(absolute);
  }

  /**
   * Resolve and return a POSIX-style absolute path string.
   * Useful for internal comparisons / logs / config-like output.
   */
  resolvePosix(inputPath: string | string[], options: ResolvePathOptions = {}): string {
    return toPosixPath(this.resolve(inputPath, options));
  }

  /**
   * Convert an absolute path to a labeled form if possible.
   * Prefers the longest matching label target.
   */
  toLabelPath(absolutePath: string): string {
    const absolute = path.resolve(absolutePath);

    const matches = [...this.labels.entries()]
      .filter(([, target]) => isSubPathOf(absolute, target) || absolute === target)
      .sort((a, b) => b[1].length - a[1].length);

    if (matches.length === 0) {
      return toPosixPath(absolute);
    }

    const [bestLabel, bestTarget] = matches[0];
    const relative = path.relative(bestTarget, absolute);

    return relative
      ? `${bestLabel}/${toPosixPath(relative)}`
      : bestLabel;
  }

  /**
   * Convert an absolute path into a path relative to project root.
   */
  toProjectRelative(absolutePath: string): string {
    return toPosixPath(path.relative(this.projectRoot, path.resolve(absolutePath))) || '.';
  }
}

/**
 * Default singleton instance of the `PathResolver` for general use.
 * Requires execution within a project directory context.
 */
export const kiwiPaths = lazySingleton(PathResolver);
export default kiwiPaths;

/**
 * Normalize arbitrary external path input into a predictable POSIX-like path string.
 *
 * Examples:
 * - "src\\app\\test" -> "src/app/test"
 * - "./src//app/" -> "src/app"
 * - "@src\\components\\x" -> "@src/components/x"
 */
export function normalizeExternalPath(inputPath: string | string[]): string {
  const inputPathStr = typeof inputPath === 'string' ? inputPath : inputPath.join('/')
  const trimmed = inputPathStr.trim();

  if (!trimmed) {
    throw new Error('Path input cannot be empty');
  }

  let normalized = trimmed.replace(/\\/g, '/');
  normalized = normalized.replace(/\/+/g, '/');

  const labelMatch = matchLabelPrefix(normalized);
  if (labelMatch) {
    const remainder = path.posix.normalize('/' + labelMatch.remainder).slice(1);
    return remainder ? `${labelMatch.label}/${remainder}` : labelMatch.label;
  }

  // Preserve leading slash for Unix-style absolute input.
  const isUnixAbsolute = normalized.startsWith('/');

  normalized = path.posix.normalize(normalized);

  if (!isUnixAbsolute && normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }

  if (normalized === '.') {
    return '';
  }

  return normalized;
}

/**
 * Walk upward from a start directory until a project root marker is found.
 */
export function findProjectRoot(
  startDir: string = process.cwd(),
  extraMarkers: string[] = [],
  requireProjectRoot: boolean = true,
): string {
  const markers = ['package.json', 'angular.json', ...extraMarkers];
  let current = path.resolve(startDir);

  while (true) {
    const hasMarker = markers.some((marker) =>
      fs.existsSync(path.join(current, marker)),
    );

    if (hasMarker) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      if (requireProjectRoot) {
        throw new Error(
          `Could not determine project root from "${startDir}". Looked for: ${markers.join(', ')}`,
        );
      }

      return path.resolve(startDir);
    }

    current = parent;
  }
}

function matchLabelPrefix(inputPath: string): { label: string; remainder: string } | null {
  const match = inputPath.match(/^(@[A-Za-z0-9_-]+)(?:\/(.*))?$/);
  if (!match) {
    return null;
  }

  return {
    label: match[1],
    remainder: match[2] ?? '',
  };
}

function assertValidLabel(label: string): void {
  if (!/^@[A-Za-z0-9_-]+$/.test(label)) {
    throw new Error(
      `Invalid label "${label}". Labels must look like @src, @root, @app.`,
    );
  }
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function fromPosixPath(filePath: string): string {
  return filePath.split('/').join(path.sep);
}

function isSubPathOf(candidate: string, parent: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}