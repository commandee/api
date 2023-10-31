import { createServer, defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";
import { viteStaticCopy } from "vite-plugin-static-copy";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [
    ...VitePluginNode({
      appPath: "./src/server.ts",
      adapter: "fastify"
    }),
    viteStaticCopy({
      targets: [
        {
          src: "public",
          dest: "."
        }
      ]
    })
  ],
  esbuild: {
    jsxFactory: "elements.createElement",
    jsxInject: 'import * as elements from "typed-html/dist/src/elements";'
  },
  server: {
    port: Number(process.env.PORT) || 3000
  },
  envPrefix: ["VITE_", "DATABASE_", "DB_"],
  publicDir: false,
  build: {
    target: "esnext",
    ssrEmitAssets: true,
    assetsInlineLimit: 0,
    minify: "terser",
    rollupOptions: {
      treeshake: true
    }
  }
});
