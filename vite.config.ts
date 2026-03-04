import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      }
    }
  }
})
