import {
  languageLabels, loadEntities, mwnfLinks, offeredLanguages, sectionMeta, useDataPackage,
} from '@metanull/viewer-core'
import { itemFromUidPath, partnerFromKey } from '@metanull/viewer-core/legacy'
import SiteShell from './SiteShell.vue'
import { countries, items, visiblePartners } from './composables/useExhibitionData.js'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// The languages this exhibition publishes (`exhibition_i18n.enabled`, declared
// by the package as `site.languages`), kept where the item translations
// actually carry them. An item sheet may offer more — whatever languages the
// record itself carries — from its own switcher, without touching the site
// language.
const languages = offeredLanguages()

// Every page renders the chrome — the header logos, the banner and its
// caption, the bottom banner and the sponsor strip — off these four; a page
// adds what it reads on top. A route also says which section it belongs
// to, and the shell reads that for the banner title and the active menu
// entry (viewer-core's `useSection`).
const CHROME = ['exhibition', 'items', 'partners', 'countries']
const meta = sectionMeta(CHROME)

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/water-in-islam-data',

  // English is the base language of every catalogue in the platform, so the
  // name the site is known by is the English one, whatever this build enables.
  siteName: manifest.site?.names?.en ?? 'Water in Islam',

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // Props for the shell: the switcher's labels come from the package, not
  // from a translator.
  navigation: {
    languages: languageLabels(languages),
  },

  // Exhibition chrome images and related-content documents live on the legacy
  // media server and were never imported; the package ships the path, this is
  // the host.
  media: {
    legacyHost: 'https://images.museumwnf.org',
  },

  // Every address this website links out to — the twelve portal addresses
  // every DXA `dataset.config.js` repeats, from viewer-core; this exhibition
  // has none of its own on top.
  links: { ...mwnfLinks },

  // The canonical routes, one view per page: a section is `/<section>`, a
  // record `/<section>/:id` with the package id, and the language, the page
  // and every filter travel in the query.
  //
  // `/theme/:id` keeps `display_order - 1`, exactly as legacy did — the About
  // theme is display order 1, so the first listed theme is `/theme/1`. It is
  // the theme's identity within this exhibition rather than a filter, and the
  // sub-theme and picture segments name which part of the theme is being
  // read, which is why they stay in the path.
  //
  // The 'home' name replaces viewer-core's generic home route.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue'), meta: meta('home') },
    { path: '/about', name: 'about', component: () => import('./views/About.vue'), meta: meta('about', 'themes') },
    { path: '/themes', name: 'themes', component: () => import('./views/Themes.vue'), meta: meta('themes', 'themes') },
    {
      path: '/theme/:id/:subtheme?/:image?',
      name: 'theme',
      component: () => import('./views/Theme.vue'),
      meta: meta('themes', 'themes', 'glossary', 'dynasties'),
    },
    {
      path: '/theme-gallery/:id/:subtheme?',
      name: 'theme-gallery',
      component: () => import('./views/ThemeGallery.vue'),
      meta: meta('themes', 'themes'),
    },
    { path: '/collection', name: 'collection', component: () => import('./views/CollectionSearch.vue'), meta: meta('collection', 'tags') },
    {
      path: '/collection-results',
      name: 'collection-results',
      component: () => import('./views/CollectionResults.vue'),
      meta: meta('collection', 'tags', 'timelines'),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemSheet.vue'),
      // The composed RecordView takes the record id as a prop, not a route read.
      props: (route) => ({ id: route.params.id }),
      meta: meta('database', 'languages', 'dynasties', 'glossary', 'timelines', 'timeline_events'),
    },
    { path: '/search', name: 'search-results', component: () => import('./views/SearchResults.vue'), meta: meta('database') },
    { path: '/how-to-search', name: 'search-how-to', component: () => import('./views/SearchHowTo.vue'), meta: meta('database') },
    { path: '/partners', name: 'partners', component: () => import('./views/Partners.vue'), meta: meta('partners') },
    { path: '/partner/:id', name: 'partner', component: () => import('./views/PartnerProfile.vue'), meta: meta('partners', 'languages') },
    {
      path: '/partner/:id/objects',
      name: 'partner-objects',
      component: () => import('./views/PartnerObjects.vue'),
      meta: meta('partners'),
    },
    {
      path: '/institution/:id',
      name: 'institution',
      component: () => import('./views/InstitutionProfile.vue'),
      meta: meta('partners', 'languages'),
    },
    {
      path: '/institution/:id/monuments',
      name: 'institution-monuments',
      component: () => import('./views/InstitutionMonuments.vue'),
      meta: meta('partners'),
    },
    { path: '/related', name: 'related', component: () => import('./views/RelatedContent.vue'), meta: meta('related', 'related_content') },
    { path: '/timeline', name: 'timeline', component: () => import('./views/Timeline.vue'), meta: meta('timeline', 'timelines', 'timeline_events') },
    {
      path: '/timeline-results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events'),
    },
    {
      path: '/timeline/gallery',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events'),
    },
    { path: '/credits', name: 'credits', component: () => import('./views/Credits.vue'), meta: meta('credits') },
  ],

  // The legacy URL shapes, redirect-only, so a legacy address pasted after
  // the `#` still lands on the right page: the item sheet's dbUid path
  // (`/database-item/mwnf3/objects/EPM/uk/Mus21/41/en`) resolves through
  // `backward_compatibility`, the partner's and the institution's country and
  // legacy id through the partner record; the language segment is dropped and
  // the page number moves to the query.
  legacyRoutes: [
    {
      path: '/database-item/:uid(.*)/:language',
      async resolve({ uid }) {
        await loadEntities(['items'])
        const item = itemFromUidPath(items.value, uid)
        return item ? { name: 'item', params: { id: item.id } } : null
      },
    },
    {
      path: '/partner/:country/:id/:language',
      async resolve({ country, id }) {
        await loadEntities(['exhibition', 'partners', 'countries'])
        const partner = partnerFromKey(visiblePartners.value, countries.value, country, id)
        return partner ? { name: 'partner', params: { id: partner.id } } : null
      },
    },
    {
      path: '/partner-objects/:country/:id/:page',
      async resolve({ country, id, page }) {
        await loadEntities(['exhibition', 'partners', 'countries'])
        const partner = partnerFromKey(visiblePartners.value, countries.value, country, id)
        if (!partner) return null
        return { name: 'partner-objects', params: { id: partner.id }, query: Number(page) > 1 ? { page } : {} }
      },
    },
    {
      path: '/institution/:country/:id/:language',
      async resolve({ country, id }) {
        await loadEntities(['exhibition', 'partners', 'countries'])
        const partner = partnerFromKey(visiblePartners.value, countries.value, country, id)
        return partner ? { name: 'institution', params: { id: partner.id } } : null
      },
    },
    {
      path: '/institution-monuments/:country/:id/:page',
      async resolve({ country, id, page }) {
        await loadEntities(['exhibition', 'partners', 'countries'])
        const partner = partnerFromKey(visiblePartners.value, countries.value, country, id)
        if (!partner) return null
        return { name: 'institution-monuments', params: { id: partner.id }, query: Number(page) > 1 ? { page } : {} }
      },
    },
    {
      path: '/timeline-gallery/:country/:start/:end/:page',
      resolve({ country, start, end, page }) {
        const query = { country }
        if (start !== 'any') query.start = start
        if (end !== 'any') query.end = end
        if (Number(page) > 1) query.page = page
        return { name: 'timeline-gallery', query }
      },
    },
    { path: '/error', resolve: () => null },
  ],
}
