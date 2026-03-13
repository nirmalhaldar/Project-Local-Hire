import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// SPA Fallback plugin for Vite - inserts middleware at the start
function spaFallback() {
  return {
    name: "spa-fallback",
    configureServer(server: ViteDevServer) {
      // Create our SPA fallback middleware
      const spaMiddleware = (req: { url?: string }, res: unknown, next: () => void) => {
        const url = req.url || "";

        // Skip if it's a file request (has extension), API call, or Vite internals
        if (
          url.includes(".") ||
          url.startsWith("/api") ||
          url.startsWith("/supabase") ||
          url.startsWith("/@") ||
          url.startsWith("/node_modules") ||
          url.startsWith("/src") ||
          url.startsWith("/public")
        ) {
          return next();
        }

        // For all other routes, serve index.html for SPA routing
        req.url = "/";
        next();
      };

      // Insert at the beginning of the middleware stack
      server.middlewares.stack.unshift({
        route: "",
        handle: spaMiddleware,
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    spaFallback(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
