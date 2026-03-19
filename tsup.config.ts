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
      cli: "src/cli.ts"
    },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    clean: false,
    minify: true,
    target: "node18",
    platform: "node",
    splitting: false,
    external: ['tsx'],
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);