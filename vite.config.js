import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  /**
   * Splitting modes here is a hack to get around shared library
   * and example code getting bundled together. There should probably
   * be a better way to achieve this.
   */
  if (mode === "production") {
    return {
      build: {
        target: "esnext",
        rollupOptions: {
          input: { src: "index.html" },
          output: {
            entryFileNames: "min.js",
          },
        },
      },
    };
  } else {
    return {
      build: {
        emptyOutDir: false,
        target: "esnext",
        rollupOptions: {
          input: { examples: "examples/index.html" },
          output: {
            entryFileNames: "entry-[name].js",
          },
        },
      },
    };
  }
});
