import { describe, expect, it } from 'vitest'
import { createViewer } from '@metanull/viewer-core'
import exhibitionData from '@metanull/water-in-islam-data/exhibition.json'
import config from '../src/dataset.config.js'

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    window.location.hash = '#/'
    const app = createViewer(config)
    const host = document.createElement('div')
    document.body.appendChild(host)
    app.mount(host)
    await app.config.globalProperties.$router.isReady()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  })

  it('declares every legacy route', () => {
    const paths = config.extraViews.map((r) => r.path)
    for (const path of [
      '/',
      '/about',
      '/themes',
      '/theme/:id/:subtheme?/:image?',
      '/theme-gallery/:id/:subtheme?',
      '/collection',
      '/collection-results',
      '/database-item/:uid(.*)/:language',
      '/search',
      '/how-to-search',
      '/partners',
      '/partner/:country/:id/:language',
      '/partner-objects/:country/:id/:page',
      '/institution/:country/:id/:language',
      '/institution-monuments/:country/:id/:page',
      '/related',
      '/timeline',
      '/timeline-results',
      '/timeline-gallery/:country/:start/:end/:page',
      '/credits',
      '/error',
    ]) {
      expect(paths).toContain(path)
    }
    // Anything else lands on the error page rather than a blank view.
    expect(paths).toContain('/:pathMatch(.*)*')
  })

  it('offers only the languages the exhibition enables', () => {
    // `languages_enabled` is exhibition_i18n.enabled — what this deployment
    // actually publishes. It is deliberately not the manifest's list, and not
    // `languages` (the UI roster) either: the two need not agree.
    const enabled = exhibitionData.languages_enabled?.length
      ? exhibitionData.languages_enabled
      : exhibitionData.languages
    expect([...config.languages].sort()).toEqual([...enabled].sort())
    // viewer-core boots vue-i18n at languages[0].
    expect(config.languages[0]).toBe('en')
  })

  it('names the site after the exhibition itself', () => {
    expect(config.siteName).toBe(exhibitionData.titles.en)
  })
})
