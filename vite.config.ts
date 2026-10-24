import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

const devProxy = {
  "^/api(?:/|\\?|$)": "http://127.0.0.1:3000",
} as const;

const resolve = {
  alias: {
    "@fe": fileURLToPath(new URL("./src/client", import.meta.url)),
    "@be": fileURLToPath(new URL("./src/server", import.meta.url)),
    "@s": fileURLToPath(new URL("./src/shared", import.meta.url)),
  },
};

// https://vite.dev/config/
export default defineConfig({
  root: "src/client",
  resolve,
  server: {
    proxy: devProxy,
  },
  preview: {
    proxy: devProxy,
  },
  test: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    projects: [
      {
        resolve,
        test: {
          name: "unit",
          env: { CONTENT_ROOT: "./content", THUMBNAIL_ROOT: "./thumbnails" },
          environment: "node",
          include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
        },
      },
      {
        resolve,
        test: {
          name: "component",
          env: { CONTENT_ROOT: "./content", THUMBNAIL_ROOT: "./thumbnails" },
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./tests/setup-component.ts"],
        },
      },
    ],
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  fmt: {
    sortTailwindcss: {
      stylesheet: "./src/client/index.css",
    },
  },
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
});
