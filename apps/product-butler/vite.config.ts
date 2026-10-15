import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(projectRoot, "./src") },
      { find: /^react$/, replacement: path.resolve(projectRoot, "wordpress-externals/react.js") },
      { find: /^react-dom$/, replacement: path.resolve(projectRoot, "wordpress-externals/react-dom.js") },
      { find: /^react-dom\/client$/, replacement: path.resolve(projectRoot, "wordpress-externals/react-dom.js") },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(projectRoot, "wordpress-externals/react-jsx-runtime.js") },
    ],
  },
  build: {
    outDir: path.resolve(projectRoot, "../../assets/build"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(projectRoot, "src/main.tsx"),
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "editor-vendor";
          if (id.includes("@radix-ui") || id.includes("cmdk")) return "ui-vendor";
          if (id.includes("scheduler")) return "react-vendor";
          return "vendor";
        },
      },
    },
  },
});
