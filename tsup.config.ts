import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["./src/cli/index.ts"],
    format: ["esm"],
    dts: false,
    clean: true,
    bundle: true,
    splitting: false,
    minify: "terser",
    target: "esnext",
    treeshake: true,
    esbuildOptions(options) {
      options.drop = ["debugger"];
    },
  },
]);
