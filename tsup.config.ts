import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  {
    entry: {
      index: "src/lib/index.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: true,
    target: "node18",
    platform: "node",
    outDir: "dist/api",
    external: [
      'templates',
      'tsx/esm/api',
      'clipboardy'
    ],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  },{
    entry: {
      index: "src/index.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    target: "node18",
    platform: "node",
    external: ['@kiwi-js/cli/api'],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  },{
    entry: {
      templates: "src/lib/templates/template.registry.ts",
      cli: "src/cli.ts",
    },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    clean: false,
    minify: true,
    target: "node18",
    platform: "node",
    splitting: false,
    external: [
      'templates',
      'tsx/esm/api',
      'clipboardy',
      '@kiwi-js/cli/api'
    ],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);