import { createServer, defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";
import { viteStaticCopy } from "vite-plugin-static-copy";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [
    ...VitePluginNode({
      appPath: "./src/index.ts",
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
    jsxInject: `import * as elements from "typed-html/dist/src/elements"`
  },
  server: {
    port: Number(process.env.PORT) || 3000
  },
  publicDir: false,
  build: {
    target: "esnext",
    ssrEmitAssets: true
  }
});
