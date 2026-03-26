import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  {
    entry: {
      templates: "src/lib/templates/template.registry.ts",
      cli: "src/cli.ts",
    },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    clean: true,
    minify: true,
    target: "node18",
    platform: "node",
    splitting: false,
    external: [
      'templates',
      'tsx',
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
    external: ['./cli'],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);