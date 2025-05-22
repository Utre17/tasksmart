import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optimized Vite Configuration for React with Automatic JSX
export default defineConfig({
  plugins: [
    react({
      // Automatic JSX Runtime for React
      jsxRuntime: 'automatic',
      // Enable babel decorators
      babel: {
        plugins: [
          ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]
        ],
      },
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  esbuild: {
    // Explicit JSX settings for React
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  // Add explicit dev server options
  server: {
    hmr: {
      protocol: 'ws',
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
    cors: true,
  },
  // Optimize dependencies to avoid CSP issues
  optimizeDeps: {
    include: ['react', 'react-dom', '@radix-ui/react-toast']
  }
});
