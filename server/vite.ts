import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, type InlineConfig } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import * as logger from "./utils/logger";

// Setup Vite with Express Middleware
export async function setupVite(app: Express, server: Server) {
  // Get the directory name properly for ES Modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Resolve the client root directory path
  const clientRoot = path.resolve(__dirname, "..", "client");
  
  // Configure Vite with the right paths and settings
  const serverOptions: InlineConfig = {
    root: clientRoot,
    server: {
      middlewareMode: true,
      hmr: {
        server,
        port: 5000, // Same port as Express server
        clientPort: 5000, // Force client to use same port
      },
    },
    appType: "spa" as const,
    base: "/",
    configFile: false,
  };

  try {
    logger.log("Initializing Vite dev server", "vite");
    
    const vite = await createViteServer({
      ...viteConfig,
      ...serverOptions,
    });

    // Use Vite's middlewares
    app.use(vite.middlewares);

    // Serve Vite-Transformed HTML
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Resolve the client template path using __dirname
        const indexHtmlPath = path.resolve(clientRoot, "index.html");
        
        logger.debug(`Loading template from: ${indexHtmlPath}`, "vite");

        // Read fresh index.html template
        const template = await fs.promises.readFile(indexHtmlPath, "utf-8");
        
        // Transform the template with Vite
        const transformedHtml = await vite.transformIndexHtml(url, template);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        logger.error("Vite HTML transformation error", e);
        next(e);
      }
    });
    
    logger.log("Vite dev server middleware initialized", "vite");
  } catch (error) {
    logger.error("Failed to initialize Vite dev server", error);
    throw error;
  }
}

// Serve Static Files for Production
export function serveStatic(app: Express) {
  // Get the directory name properly for ES Modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Resolve dist path using __dirname
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    logger.error(`Could not find the build directory: ${distPath}`);
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to build the client first.`
    );
  }

  // Serve Static Files
  logger.log(`Serving static files from: ${distPath}`, "static");
  app.use(express.static(distPath));

  // Fallback to index.html for SPA (Single-Page Application)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
