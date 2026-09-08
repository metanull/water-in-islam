import { fileURLToPath } from 'node:url'
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
  resolve: {
    ...viewerConfig.resolve,
    alias: {
      // defineViewerConfig's own `@inventory-data` alias resolves
      // `./node_modules/<dataPackage>` against `import.meta.url` *inside
      // viewer-core's installed package* (the module that literally defines
      // the helper), not against this file — landing inside viewer-core's
      // own node_modules, which does not exist, so every entity load throws
      // "Unknown entity" (confirmed against the installed 1.13.1; still
      // present at viewer-core's own HEAD). Recomputed here, relative to
      // this file, until the platform package fixes it.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/water-in-islam-data', import.meta.url),
      ),
    },
  },
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
})
