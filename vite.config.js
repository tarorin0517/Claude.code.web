import { defineConfig } from "vite";

// Relative base so the build works under a GitHub Pages project subpath
// (e.g. https://<user>.github.io/<repo>/).
export default defineConfig({
  base: "./",
});
