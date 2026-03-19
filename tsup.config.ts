import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  {
    entry: {
      cli: "src/cli.ts"
    },
    format: ["esm"],
    dts: false,
    sourcemap: false,
    clean: true,
    minify: true,
    target: "node18",
    platform: "node",
    splitting: false,
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);