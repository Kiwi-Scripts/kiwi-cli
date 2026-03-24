import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node18",
    platform: "node",
    external: ['tsx'],
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
      '@lib/templates/template.registry',
      'tsx',
      'clipboardy'
    ],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);