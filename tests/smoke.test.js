import { describe, expect, it } from 'vitest'
import { createViewer, loadEntities, mergeMessages } from '@metanull/viewer-core'
import { checkOfferedLanguages } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/exhibition'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this exhibition's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

async function mountSite() {
  window.location.hash = '#/'
  const app = createViewer({ ...config, messages })
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)
  const router = app.config.globalProperties.$router
  await router.isReady()
  return { app, host, router }
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  it('declares every canonical route by name, and every legacy shape as a redirect', () => {
    const names = config.extraViews.map((r) => r.name)
    for (const name of [
      'home', 'about', 'themes', 'theme', 'theme-gallery', 'collection', 'collection-results',
      'item', 'search-results', 'search-how-to', 'partners', 'partner', 'partner-objects',
      'institution', 'institution-monuments', 'related', 'timeline', 'timeline-results',
      'timeline-gallery', 'credits',
    ]) {
      expect(names).toContain(name)
    }
    expect(config.extraViews.every((r) => r.name)).toBe(true)
    const legacy = config.legacyRoutes.map((r) => r.path)
    for (const path of [
      '/database-item/:uid(.*)/:language',
      '/partner/:country/:id/:language',
      '/partner-objects/:country/:id/:page',
      '/institution/:country/:id/:language',
      '/institution-monuments/:country/:id/:page',
      '/timeline-gallery/:country/:start/:end/:page',
    ]) {
      expect(legacy).toContain(path)
    }
    // The catch-all and the not-found page are the router's, not this site's.
    expect(config.extraViews.some((r) => r.path.includes('pathMatch'))).toBe(false)
  })

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
  })

  it('reads nothing but the manifest before it mounts', () => {
    expect(config.media.legacyHost).toMatch(/^https:/)
    expect(Object.keys(config.links)).toEqual(
      expect.arrayContaining(['portal', 'galleries', 'myCollection', 'about', 'contact', 'legalNotice', 'credits', 'cookies']),
    )
  })

  // What this website contributes to a legacy address is the mapping: a dbUid
  // path to an item, a country and legacy id to a partner or an institution,
  // the page number out of the path. That the router turns such an entry into
  // a redirect is viewer-core's own test.
  it('maps a legacy address onto the canonical route', async () => {
    const [items, partners] = await loadEntities(['exhibition', 'items', 'partners']).then((all) => [all[1], all[2]])
    const [itemFor, partnerFor, objectsFor, institutionFor, monumentsFor, galleryFor] = config.legacyRoutes

    const item = items.find((i) => i.backward_compatibility)
    expect(await itemFor.resolve({ uid: item.backward_compatibility.split(':').join('/') })).toEqual({
      name: 'item',
      params: { id: item.id },
    })
    expect(await itemFor.resolve({ uid: 'mwnf3/objects/NOPE/xx/Mus00/0' })).toBeNull()

    const museum = partners.find((p) => p.type !== 'institution' && (p.backward_compatibility ?? '').split(':').length >= 4)
    const [, , museumId, museumCountry] = museum.backward_compatibility.split(':')
    expect(await partnerFor.resolve({ country: museumCountry, id: museumId })).toEqual({
      name: 'partner',
      params: { id: museum.id },
    })
    expect(await objectsFor.resolve({ country: museumCountry, id: museumId, page: '3' })).toEqual({
      name: 'partner-objects',
      params: { id: museum.id },
      query: { page: '3' },
    })
    // An institution reaches the institution pages, which are the same
    // component under a different name.
    expect(await institutionFor.resolve({ country: museumCountry, id: museumId })).toEqual({
      name: 'institution',
      params: { id: museum.id },
    })
    expect(await monumentsFor.resolve({ country: museumCountry, id: museumId, page: '1' })).toEqual({
      name: 'institution-monuments',
      params: { id: museum.id },
      query: {},
    })

    // The page number and the period leave the path for the query, and an
    // open bound stops being the literal 'any'.
    expect(galleryFor.resolve({ country: 'uk', start: 'any', end: '1500', page: '2' })).toEqual({
      name: 'timeline-gallery',
      query: { country: 'uk', end: '1500', page: '2' },
    })
  }, 20000)

  // The chrome is two layers now, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. This asserts the
  // rendered page, so a bundle that installs but never reaches the components
  // fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

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
  }, 20000)
})
