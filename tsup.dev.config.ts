import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  {
    entry: {
      cli: "src/cli.ts"
    },
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: "node18",
    platform: "node",
    splitting: false,
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
]);