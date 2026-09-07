import {
  aboutTheme, owningTheme, subIndexOf, themeRouteId, themeTree,
} from './themes.js'

// The theme page's EssayView spec (Theme.vue) and the About page's (About.vue,
// the same node rendered in `about` mode for the exhibition's own theme zero
// — see the "About mode" note below). Both share everything but `about`:
// `tree` is the single `useCollectionTree` instance from themes.js, so a
// visit here reads the exact tour `previous`/`next` order every other page
// that walks the tree agrees with; `panel: true` only keeps EssayView's own
// side column engaged (`hasPanel`) — the panel and thumbnail strip
// themselves are this family's own picture→parent indirection and the
// related-works toggle, built in Theme.vue's `panel`/`thumbnails` slots
// rather than the default `items` machinery, because several curated crops
// can share one catalogue parent (or none, when a picture's parent was not
// exported into this package) and the default model addresses one record per
// id; `numbering: false` because the numeral this site shows is the *owning
// theme's*, not a node's position among `tree`'s siblings — which
// `collectionTreeFromThemes` cannot supply for a top-level theme in the first
// place, since it documents `root` as always null for a themes.json package.
// `romanFor` stays in themes.js and Theme.vue's own `#header` slot renders it.

/** A tree node's own page: the about theme routes to /about, any other to /theme/:id/:sub. */
export function themeNodeRoute(node) {
  if (!node) return null
  if (aboutTheme.value && node.id === aboutTheme.value.id) return { name: 'about' }
  const owner = owningTheme(node)
  const sub = subIndexOf(node)
  return {
    name: 'theme',
    params: { id: String(themeRouteId(owner)), subtheme: sub === null ? 'overview' : String(sub) },
  }
}

const shared = {
  tree: themeTree,
  entity: 'items',
  route: (node) => themeNodeRoute(node),
  quote: 'quote',
  body: 'presentation',
  glossary: true,
  panel: true,
  navigation: 'tree',
  numbering: false,
}

// About mode: legacy's AboutPage renders the About theme (display order 1)
// with the exhibition's own title/subtitle standing in for the theme's — see
// Theme.vue's `heading`/`subHeading`. `about: () => true` is unconditional
// because this spec is only ever mounted at the fixed About-theme id;
// `themeSpec` below is `() => false` unconditionally for the opposite reason
// — a legacy `/theme/0` link (the About theme's own route id) must still
// render as an ordinary theme page, panel and all, exactly as it did before
// this migration, and EssayView's `about` mode drops the side column
// (`hasSide`) for any node it is true for, whichever spec supplies it.
export const themeSpec = { ...shared, about: () => false }
export const aboutSpec = { ...shared, about: () => true }
