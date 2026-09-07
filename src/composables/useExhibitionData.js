import { computed } from 'vue'
import {
  byId, entityRef, mediaUrl, useCatalogueData,
  projectName as coreProjectName, projectFamily as coreProjectFamily,
} from '@metanull/viewer-core'

// The exhibition's records, read the one way every website reads them:
// through viewer-core, lazily. Each entity is a shared ref that stays `null`
// until a route declaring it in `meta.entities` brings its chunk in, so
// importing this module loads nothing, and a page pays only for what it
// reads. Nothing here keeps a copy of a record or a translation.
//
// `useCatalogueData` is the wrapper half of this module: `tr`, `md`/
// `mdInline`/`mdStrip`, `loadEnglish`, `labelOf` and the two `visible` rules
// below are viewer-core's, called once here and re-exported beside what is
// genuinely this site's own — routes, legacy key mappings, chrome images,
// the themes tree, the exhibition's own project override.

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by `useRecordLanguage`.
export const defaultLang = 'en'

export const exhibition = entityRef('exhibition')
export const themeTree = entityRef('themes')
export const relatedContent = entityRef('related_content')
export const tags = entityRef('tags')
export const countries = entityRef('countries')
export const languages = entityRef('languages')
export const dynasties = entityRef('dynasties')
export const glossary = entityRef('glossary')
export const timelines = entityRef('timelines')
export const timelineEvents = entityRef('timeline_events')

// E6: a hidden museum is exported but must not appear on any list or profile
// page. Its items still render — legacy hides the museum, not the object.
// Declared here as a `visible` predicate rather than coded into every page
// that lists partners; `isHiddenPartner` stays a named export because
// `ItemSheet`'s holder line is the one surface that needs the opposite of
// `visible` — the museum keeps its name and loses only the link, because it
// has no page to link to (legacy links no holder from an item sheet at all,
// hidden or not, so suppressing it is also the closer copy).
const hiddenPartnerIds = computed(() => new Set(exhibition.value?.hidden_partner_ids ?? []))
export function isHiddenPartner(partner) {
  return hiddenPartnerIds.value.has(partner?.id)
}

const catalogue = useCatalogueData({
  eager: ['items', 'partners', 'countries', 'glossary', 'dynasties', 'timeline_events', 'themes'],
  defaultLanguage: defaultLang,
  visible: {
    // An item's `languages` is what it has TRANSLATIONS in, so a non-empty
    // array without this build's language means the text exists in some
    // other language and not in this one — legacy's own instance 404s such a
    // record, and this build drops it to match.
    //
    // An EMPTY array is a different case and must not be swept in with it:
    // it means the package has no text in ANY language, which is a gap in
    // the export rather than a fact about the record, and legacy serves
    // those records regardless. They keep their legacy names through
    // `labelOf`'s `internal_name` fallback and lose only their
    // descriptions. Hence the `!i.languages?.length ||` guard, which reads
    // like a redundant null-check and is not.
    items: (i) => !i.languages?.length || i.languages.includes(defaultLang),
    partners: (p) => !hiddenPartnerIds.value.has(p.id),
  },
})

export const items = catalogue.entity('items')
export const itemById = catalogue.index('items')
export const visiblePartners = catalogue.entity('partners')
const visiblePartnerIndex = catalogue.index('partners')
export function visiblePartnerById(id) {
  return visiblePartnerIndex.value.get(id) ?? null
}

export const { tr, md, mdInline, mdStrip, labelOf, loadEnglish, availableLanguages, loadTranslations, translations } = catalogue
loadEnglish()

/**
 * Exhibition chrome images and the related-content PDFs.
 * `banner_image_path`, `homepage_image_path` and `document_path` were never
 * imported into inventory storage, so the package ships the legacy path and
 * the address is built from the host `dataset.config.js` declares under
 * `media`. `size` ∈ zoom | hi_res | lo_res | small | full.
 */
export function chromeImage(path, size = 'hi_res') {
  return mediaUrl(path, size)
}

// ── Lookup maps ────────────────────────────────────────────────────────────
//
// Unfiltered, unlike `itemById`/`visiblePartnerById`: a holder line still
// needs to resolve a hidden museum's name (`isHiddenPartner` above is what
// suppresses the link), and every other lookup here has no visibility rule
// to begin with.
export const partnerById = byId('partners')
export const countryById = byId('countries')
export const tagById = byId('tags')
export const dynastyById = byId('dynasties')
export const glossaryById = byId('glossary')
export const languageByCode = byId('languages', 'code')

// countries.json is keyed by the inventory id (ISO 3166-1 alpha-3), but the
// legacy two-letter code is what related_content and the timeline keyspaces
// carry. `code` is the country's own backward_compatibility, so this is the
// bridge between the two — and the reason it is a lookup rather than a parse
// is that several legacy codes are not ISO (`uk`, `pa`, `qt`, `ua`, `sb`).
export const countryByCode = computed(
  () => new Map((countries.value ?? []).filter(c => c.code).map(c => [c.code, c]))
)

/** The same label from a legacy two-letter code (`uk` → United Kingdom). */
export function countryLabelFromCode(code) {
  if (!code) return ''
  const country = countryByCode.value.get(code)
  return country ? labelOf('countries', country.id) : code
}

/** The canonical item route: the package id, and no language in the path. */
export function itemRoute(item) {
  return { name: 'item', params: { id: item.id } }
}

// Institutions (monument owners) and museums both live in partners.json — the
// package ships the union of legacy's /partners and /institutions because a
// static package has no endpoints to split them across. The viewer routes by
// `type`, which is what legacy's two page templates keyed off.
export function isInstitution(partner) {
  return partner?.type === 'institution'
}

export function partnerRoute(partner) {
  return {
    name: isInstitution(partner) ? 'institution' : 'partner',
    params: { id: partner.id },
  }
}

export function partnerObjectsRoute(partner, page = 1) {
  return {
    name: isInstitution(partner) ? 'institution-monuments' : 'partner-objects',
    params: { id: partner.id },
    query: page > 1 ? { page } : {},
  }
}

// ── Themes ─────────────────────────────────────────────────────────────────
//
// themes.json is the ordered tree: top-level themes, each with its sub-themes
// and its curated picture selections. Two rules the data fixes rather than
// taste:
//
//   * Theme 0 ("About the Exhibition") is an ordinary top-level theme that the
//     legacy client renders at /about and *skips* on /themes. Its display order
//     is 1, so the themes list starts at display order 2 and numbers those
//     "Theme I" upwards — which is why `romanFor` subtracts one.
//   * The theme id in the keyspace is not the display order. The route carries
//     `display_order - 1`, exactly as legacy's `theme.display - 1` did, so a
//     legacy URL pasted after the `#` lands on the same theme.
//
// This tree moves to viewer-core's `useCollectionTree` in wave H; left as is
// for now.

export const themes = computed(() => themeTree.value ?? [])

/** The About theme — display order 1, rendered at /about, absent from /themes. */
export const aboutTheme = computed(
  () => themes.value.find(t => t.display_order === 1) ?? null
)

/** The themes the /themes page lists: everything after the About theme. */
export const listedThemes = computed(() =>
  themes.value.filter(t => t.display_order > 1)
)

/** Route id ⇄ theme. Legacy's `/theme/:id` carries `display_order - 1`. */
export function themeByRouteId(id) {
  const n = Number(id)
  return themes.value.find(t => t.display_order - 1 === n) ?? null
}

export function themeRouteId(theme) {
  return (theme?.display_order ?? 1) - 1
}

/** Every node of the tree, top-level and sub-theme alike. */
export const allThemeNodes = computed(() => {
  const out = []
  for (const theme of themes.value) {
    out.push(theme)
    for (const sub of theme.sub_themes ?? []) out.push(sub)
  }
  return out
})

export const themeById = computed(
  () => new Map(allThemeNodes.value.map(t => [t.id, t]))
)

/** Legacy numbered its themes in Roman numerals, counting from the About theme. */
export function romanFor(displayOrder) {
  const lookup = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90],
    ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
  ]
  let n = displayOrder - 1
  let out = ''
  for (const [sym, value] of lookup) {
    while (n >= value) { out += sym; n -= value }
  }
  return out
}

/** The picture selections of a theme, ordered as the curator set them. */
export function themePictures(theme) {
  return [...(theme?.pictures ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  )
}

// ── Translations ───────────────────────────────────────────────────────────
//
// translations/themes.<lang>.json is keyed two ways: by theme id for the
// theme's own title/quote/presentation, and by `<theme id>/<picture item id>`
// for the curated text of one picture *in that theme*. The same picture in two
// themes carries two different descriptions, which is why the pivot key exists.

export function themeText(theme, lang = defaultLang) {
  return tr('themes', theme?.id, lang)
}

export function pictureText(theme, picture, lang = defaultLang) {
  if (!theme?.id || !picture?.picture_item_id) return {}
  return tr('themes', `${theme.id}/${picture.picture_item_id}`, lang)
}

// ── Source projects ────────────────────────────────────────────────────────
//
// A member is borrowed from the MWNF project that originally published it,
// and legacy names and colours that project on the item sheet and in the
// results grid. `projectName`/`projectFamily` here are this exhibition's own
// rule on top of viewer-core's shared tables (`core.project.*` and the
// family-to-swatch map): a native member cites the exhibition's own title
// rather than a project name, and colours it with the shared `EXH` family —
// the one thing viewer-core cannot know, because the exhibition's own key
// (`GalEx6`) and title are this deployment's, not a legacy project.
const nativeProjectKey = computed(() => exhibition.value?.mwnf3_project_id ?? null)

// Some members have no `project_key` at all: they come from the Explore
// monuments database rather than from a project, which is why provenance has
// to be read from the keyspace here instead of from the field. Legacy still
// colours them — `#info-citation-link` carries an `Explore` class — and still
// prints an empty project name, so its citation reads `"…" in , Museum With No
// Frontiers, …` with a hole in it. The colour is reproduced; the empty name is
// not, because a label reading "for" with nothing after it is a rendering
// fault rather than a faithful copy. The line is dropped instead.
function isExploreRecord(item) {
  return (item?.backward_compatibility ?? '').startsWith('mwnf3_explore:')
}

/** Legacy's `#info-project-name`. Empty when legacy leaves it empty. */
export function projectName(item, t) {
  const key = item?.project_key
  if (!key) return ''
  if (key === nativeProjectKey.value) return exhibitionTitle(defaultLang)
  return coreProjectName(key, t)
}

/** Legacy's family class on `#info-citation-link`, for the colour swatch. */
export function projectFamily(item) {
  const key = item?.project_key
  if (!key) return isExploreRecord(item) ? 'Explore' : ''
  if (key === nativeProjectKey.value) return 'EXH'
  return coreProjectFamily(key)
}

/** The exhibition's own per-language chrome text. */
export function exhibitionTitle(lang = defaultLang) {
  return exhibition.value?.titles?.[lang] ?? exhibition.value?.titles?.en ?? ''
}

export function exhibitionSubtitle(lang = defaultLang) {
  return exhibition.value?.subtitles?.[lang] ?? exhibition.value?.subtitles?.en ?? ''
}

export function exhibitionHeadline(lang = defaultLang) {
  return exhibition.value?.headlines?.[lang] ?? exhibition.value?.headlines?.en ?? ''
}

export function bannerCaption(lang = defaultLang) {
  return exhibition.value?.banner_captions?.[lang] ?? exhibition.value?.banner_captions?.en ?? ''
}

// ── Sibling sites ──────────────────────────────────────────────────────────
//
// Decision Q3: these are reference objects, not resolved links. The exporter
// records identity plus whatever the import carried; where a `legacy_host` came
// across we can link to it, and where it did not the entry still renders — it
// just does not become an anchor.

export const siblingSites = computed(() =>
  (exhibition.value?.sibling_sites ?? []).filter(s => !s.hidden)
)

export function siblingUrl(sibling) {
  return sibling?.legacy_host || null
}
