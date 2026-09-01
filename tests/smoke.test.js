import { describe, expect, it } from 'vitest'
import { createViewer, mergeMessages } from '@metanull/viewer-core'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/exhibition'
import exhibitionData from '@metanull/water-in-islam-data/exhibition.json'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this exhibition's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    window.location.hash = '#/'
    const app = createViewer({ ...config, messages })
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
    // The order is the package's now, not a forced English-first: viewer-core
    // negotiates the opening language, so nothing may depend on it again.
    expect(config.languages).toEqual(enabled)
  })

  it('names the site after the exhibition itself', () => {
    expect(config.siteName).toBe(exhibitionData.titles.en)
  })

  // The chrome is two layers now, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. This asserts the
  // rendered page, so a bundle that installs but never reaches the components
  // fails here too.
  it('renders the shared texts and its own over them', async () => {
    window.location.hash = '#/'
    const app = createViewer({ ...config, messages })
    const host = document.createElement('div')
    document.body.appendChild(host)
    app.mount(host)
    await app.config.globalProperties.$router.isReady()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link, a menu entry, and the strapline
    // under the exhibition's title.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Themes')
    expect(text).toContain('A MWNF online exhibition.')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one.
    expect(text).not.toMatch(/\b(waterInIslam|exhibition|core|layout)\.[a-z]/i)

    app.unmount()
  })
})
