import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineViewerConfig } from '@metanull/viewer-core/vite'

// The shared shape (the optimizeDeps in/exclude lists, the Vitest inline
// deps) now comes from viewer-core 1.13.1's own helper instead of being
// hand-copied across the seven websites; only what is this site's own — the
// base path — stays here.
const viewerConfig = defineViewerConfig({ dataPackage: '@metanull/water-in-islam-data', plugins: [vue()] })

export default defineConfig({
  ...viewerConfig,
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
})
