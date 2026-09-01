import { exhibitionTitle, siteLanguages } from './composables/useExhibitionData.js'
import SiteShell from './SiteShell.vue'

// The languages this build may offer are `exhibition.languages_enabled` — what
// `exhibition_i18n.enabled` actually publishes — not the manifest's list of
// every language some record happens to carry. Per the epic's decision Q2 an
// exhibition ships one build per enabled language; this one enables English
// alone, so the shell shows no language switcher.
//
// The list used to be forced to start with English because the site opened at
// `languages[0]`. viewer-core negotiates the opening language now — an explicit
// `?lang=`, then the visitor's remembered choice, then their browser, then
// English — so the package's own order stands. With one enabled language it
// makes no difference here; it will the day a second one is enabled.
const languages = siteLanguages

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/water-in-islam-data',

  // English is the base language of every catalogue in the platform, so the
  // name the site is known by is the English one, whatever this build enables.
  siteName: exhibitionTitle('en'),

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  // The shell supplies its header, banner, navigation, bottom banner, logo
  // strip and footer through PageShell's slots, so there is no `navigation`
  // prop bag to pass.
  shell: SiteShell,

  // The legacy route map, one view per page. Paths mirror the legacy client's
  // routes one for one, including the item sheet's dbUid path
  // (`/database-item/mwnf3/objects/EPM/uk/Mus21/41/en`), so a legacy URL can be
  // pasted after the `#` and land on the same page.
  //
  // `/theme/:id` carries `display_order - 1`, exactly as legacy did — the About
  // theme is display order 1, so the first listed theme is `/theme/1`.
  // `:subtheme` is either the literal `overview` or a 1-based index into the
  // theme's sub-themes; `:image` is a 1-based index into the theme's picture
  // selections.
  //
  // Two deliberate differences from legacy, both because the inventory model
  // has no counterpart for a segment legacy resolved server-side:
  //
  //   * the partner and institution routes drop the project-id segment
  //     (`/partner/dz/Mus01/en`, not `/partner/ISL/dz/Mus01/en`), since
  //     partners.project_id is null for every imported museum;
  //   * `/institution/:country/:id/:language` takes the same shape as
  //     `/partner` rather than legacy's catch-all `pathMatch`, because a
  //     package routes by partner `type` instead of by which endpoint answered.
  //
  // The 'home' name replaces viewer-core's generic home route.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/about', name: 'about', component: () => import('./views/About.vue') },
    { path: '/themes', name: 'themes', component: () => import('./views/Themes.vue') },
    { path: '/theme/:id/:subtheme?/:image?', name: 'theme', component: () => import('./views/Theme.vue') },
    {
      path: '/theme-gallery/:id/:subtheme?',
      name: 'theme-gallery',
      component: () => import('./views/ThemeGallery.vue'),
    },
    { path: '/collection', name: 'collection', component: () => import('./views/CollectionSearch.vue') },
    {
      path: '/collection-results',
      name: 'collection-results',
      component: () => import('./views/CollectionResults.vue'),
    },
    {
      path: '/database-item/:uid(.*)/:language',
      name: 'database-item',
      component: () => import('./views/ItemSheet.vue'),
    },
    { path: '/search', name: 'search-results', component: () => import('./views/SearchResults.vue') },
    { path: '/how-to-search', name: 'search-how-to', component: () => import('./views/SearchHowTo.vue') },
    { path: '/partners', name: 'partners', component: () => import('./views/Partners.vue') },
    {
      path: '/partner/:country/:id/:language',
      name: 'partner',
      component: () => import('./views/PartnerProfile.vue'),
    },
    {
      path: '/partner-objects/:country/:id/:page',
      name: 'partner-objects',
      component: () => import('./views/PartnerObjects.vue'),
    },
    {
      path: '/institution/:country/:id/:language',
      name: 'institution',
      component: () => import('./views/InstitutionProfile.vue'),
    },
    {
      path: '/institution-monuments/:country/:id/:page',
      name: 'institution-monuments',
      component: () => import('./views/InstitutionMonuments.vue'),
    },
    { path: '/related', name: 'related', component: () => import('./views/RelatedContent.vue') },
    { path: '/timeline', name: 'timeline', component: () => import('./views/Timeline.vue') },
    {
      path: '/timeline-results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
    },
    {
      path: '/timeline-gallery/:country/:start/:end/:page',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
    },
    { path: '/credits', name: 'credits', component: () => import('./views/Credits.vue') },
    { path: '/error', name: 'error', component: () => import('./views/ErrorPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/error' },
  ],
}
