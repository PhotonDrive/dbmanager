// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Your main entry point
  format: ["esm", "cjs", "iife"], // Output formats (ESM and CommonJS)
  dts: true, // Generate TypeScript declaration files
  clean: true, // Clean output directory before building
  minify: true, // Enable minification
  splitting: false,
  sourcemap: false, // Generate source maps
  treeshake: true,
  shims: true,
});
