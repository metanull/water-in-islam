import { computed } from 'vue'
import {
  byId, entityRef, mediaUrl, renderBlock, renderInline, renderPlain, useDataPackage,
} from '@metanull/viewer-core'

// The exhibition's records, read the one way every website reads them:
// through viewer-core, lazily. Each entity is a shared ref that stays `null`
// until a route declaring it in `meta.entities` brings its chunk in, so
// importing this module loads nothing, and a page pays only for what it
// reads. Nothing here keeps a copy of a record or a translation.

const dataPackage = useDataPackage()
export const manifest = dataPackage.manifest

// ── Records ────────────────────────────────────────────────────────────────
// Language-independent; every human-readable string lives under translations/.

export const exhibition = entityRef('exhibition')
export const themeTree = entityRef('themes')
export const relatedContent = entityRef('related_content')
export const allItems = entityRef('items')
export const tags = entityRef('tags')
export const partners = entityRef('partners')
export const countries = entityRef('countries')
export const languages = entityRef('languages')
export const dynasties = entityRef('dynasties')
export const glossary = entityRef('glossary')
export const timelines = entityRef('timelines')
export const timelineEvents = entityRef('timeline_events')

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by `useRecordLanguage`.
export const defaultLang = 'en'

// A per-language build does not list a record it cannot render. The package
// ships every member with its `languages` array intact and leaves the decision
// here, because the decision belongs to the build rather than to the export.
//
// An item's `languages` is what it has TRANSLATIONS in, so a non-empty array
// without this build's language means the text exists in some other language
// and not in this one — legacy's own instance 404s such a record, and this
// build drops it to match.
//
// An EMPTY array is a different case and must not be swept in with it: it
// means the package has no text in ANY language, which is a gap in the export
// rather than a fact about the record, and legacy serves those records
// regardless. They keep their legacy names through `itemLabel`'s
// `internal_name` fallback and lose only their descriptions. Hence the
// `!i.languages?.length ||` guard, which reads like a redundant null-check and
// is not.
export const items = computed(() =>
  (allItems.value ?? []).filter(i => !i.languages?.length || i.languages.includes(defaultLang))
)

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

// `items` is this build's renderable subset rather than the whole entity, so
// its map is derived here; every other map is viewer-core's shared index.
export const itemById = computed(() => new Map(items.value.map(i => [i.id, i])))
export const partnerById = byId('partners')
export const countryById = byId('countries')
export const tagById = byId('tags')
export const dynastyById = byId('dynasties')
export const glossaryById = byId('glossary')
export const timelineById = byId('timelines')
export const languageByCode = byId('languages', 'code')

// countries.json is keyed by the inventory id (ISO 3166-1 alpha-3), but the
// legacy two-letter code is what related_content and the timeline keyspaces
// carry. `code` is the country's own backward_compatibility, so this is the
// bridge between the two — and the reason it is a lookup rather than a parse
// is that several legacy codes are not ISO (`uk`, `pa`, `qt`, `ua`, `sb`).
export const countryByCode = computed(
  () => new Map((countries.value ?? []).filter(c => c.code).map(c => [c.code, c]))
)

// Legacy dbUid ⇄ item. The public item URL keeps the dbUid path, which is
// exactly `backward_compatibility` with ':' swapped for '/' — the identity rule
// in dxa-legacy-analysis.md §4.2. Matching is case-insensitive because Sharing
// History stores its keys lowercase.
export const itemByUid = computed(() => {
  const m = new Map()
  for (const item of items.value) {
    if (item.backward_compatibility) m.set(item.backward_compatibility.toLowerCase(), item)
  }
  return m
})

/** The canonical item route: the package id, and no language in the path. */
export function itemRoute(item) {
  return { name: 'item', params: { id: item.id } }
}

export function itemFromUidPath(path) {
  return itemByUid.value.get(String(path).split('/').join(':').toLowerCase()) ?? null
}

// Partner identity: `mwnf3:museums:Mus21:ua` → { legacyId: 'Mus21', country: 'ua' }.
// Legacy's partner URL also carried a project id; the inventory model has no
// per-partner project (partners.project_id is null for every imported museum),
// so the route drops that segment rather than inventing one.
//
// Sharing History keys its partners differently — `mwnf3_sharing_history:
// sh_partners:at_01_d` has no country segment at all, the country is the key's
// own prefix. Reading parts[3] there yields an empty URL segment, so the two
// shapes are handled apart rather than by index.
export function partnerKey(partner) {
  const bc = partner?.backward_compatibility ?? ''
  const parts = bc.split(':')
  if (parts[0] === 'mwnf3_sharing_history') {
    const key = parts[2] ?? partner?.id ?? ''
    return { legacyId: key, countryCode: key.split('_')[0] }
  }
  return { legacyId: parts[2] ?? partner?.id, countryCode: parts[3] ?? '' }
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

/**
 * The partner a `/partner/:country/:id` route names — hidden museums excluded,
 * so every route that resolves a partner from the URL 404s for one, the way
 * legacy's endpoints simply do not serve them.
 */
export function partnerFromKey(countryCode, legacyId) {
  return (partners.value ?? []).find(p => {
    if (isHiddenPartner(p)) return false
    const k = partnerKey(p)
    return k.legacyId === legacyId && k.countryCode === countryCode
  }) ?? null
}

/** The same rule for a partner reached by its package id, from a canonical route. */
export function visiblePartnerById(id) {
  const partner = partnerById.value.get(id) ?? null
  return partner && !isHiddenPartner(partner) ? partner : null
}

// E6: a hidden museum is exported but must not appear on any list or profile
// page. Its items still render — legacy hides the museum, not the object.
//
// The polarity is what matters: a hidden museum is FLAGGED, never dropped from
// `partners.json`. Its items still name it as their holder, so removing the
// record would leave them pointing at nothing.
//
// Three surfaces enforce it, and they are all the surfaces there are:
//   * `visiblePartners` — the /partners list.
//   * `partnerFromKey` above — the profile and the objects pages, reached by
//     URL, including a URL typed or bookmarked from the live site.
//   * `ItemSheet` — the holder line, which prints the museum's name but drops
//     the link this viewer adds. Legacy links no holder from an item sheet at
//     all, hidden or not, so suppressing it is also the closer copy.
const hiddenPartners = computed(() => new Set(exhibition.value?.hidden_partner_ids ?? []))
export function isHiddenPartner(partner) {
  return hiddenPartners.value.has(partner?.id)
}

/** Every partner the site may list: museums and institutions, minus the hidden. */
export const visiblePartners = computed(() =>
  (partners.value ?? []).filter(p => !hiddenPartners.value.has(p.id))
)

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

export const themeByBc = computed(
  () => new Map(allThemeNodes.value.map(t => [t.backward_compatibility, t]))
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
// One file per entity per language; a file is simply absent when that entity
// has no translation in that language, so every load path must tolerate a miss.
// English is loaded eagerly (it drives every list and label); other languages
// are loaded on demand by the item sheet and the partner profile.
// Delegates to viewer-core's useDataPackage() — the shared, glob-based
// loader — rather than a local copy of the same glob/cache.

export const availableLanguages = dataPackage.availableLanguages
export const loadTranslations = dataPackage.loadTranslations
export const translations = dataPackage.translations

/** One record's translation, falling back to English then to nothing. */
export function tr(entity, id, lang) {
  return dataPackage.tr(entity, id, lang, defaultLang)
}

const EN_ENTITIES = [
  'items', 'partners', 'countries', 'glossary', 'dynasties', 'timeline_events',
  'themes',
]

let englishReady = null
export function loadEnglish() {
  if (!englishReady) {
    englishReady = Promise.all(EN_ENTITIES.map(e => loadTranslations(e, defaultLang)))
  }
  return englishReady
}
loadEnglish()

// ── Theme text ─────────────────────────────────────────────────────────────
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
// A member is borrowed from the MWNF project that originally published it, and
// legacy names and colours that project on the item sheet and in the results
// grid. Two separate mappings, because legacy keeps them separate: the NAME is
// per project key, the COLOUR is per project FAMILY — `#info-citation-link`
// takes one class per family, so ISL and EPM share a swatch and every
// exhibition shares another.
//
// Both were read off the live instance rather than assumed. The classes and
// their colours are in its own compiled stylesheet; the per-key names and the
// key → family assignment were confirmed by loading one member of each family
// and reading `#info-project-name` and the citation block's class.
//
// The tables live here rather than in the two components that render them.
// Duplicating them is how the monorepo viewer acquired a wrong DGA swatch —
// the Explore green instead of `#0059bf` — in one copy and not the other,
// where it stayed invisible because no member happened to use it.
const PROJECT_NAMES = {
  ISL: 'Discover Islamic Art',
  EPM: 'Explore Islamic Art Collections',
  DBA: 'Discover Baroque Art',
  BAR: 'Discover Baroque Art',
  AWE: 'Sharing History',
  awe: 'Sharing History',
  DCA: 'Discover Carpet Art',
  DGA: 'Discover Glass Art',
  EXTHE: 'The Table Is Set',
  GALLERIES: 'MWNF Galleries',
}

// Legacy's own class names, so the CSS in App.vue reads as the stylesheet it
// was copied from. A key with no entry falls back to itself.
const PROJECT_FAMILIES = {
  ISL: 'ISLandEPM',
  EPM: 'ISLandEPM',
  DBA: 'DBA',
  BAR: 'DBA',
  AWE: 'AWE',
  awe: 'AWE',
  DCA: 'DCA',
  DGA: 'DGA',
  EXTHE: 'EXH',
  GALLERIES: 'Galleries',
}

// The exhibition's own project is not in either table, because its key is this
// deployment's (`GalEx6`) and its name is the exhibition's own title — legacy
// answers "Water in Islam" for a native member and colours it with the shared
// EXH purple, the same swatch it gives The Table Is Set.
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
export function projectName(item) {
  const key = item?.project_key
  if (!key) return ''
  if (key === nativeProjectKey.value) return exhibitionTitle(defaultLang)
  return PROJECT_NAMES[key] ?? key
}

/** Legacy's family class on `#info-citation-link`, for the colour swatch. */
export function projectFamily(item) {
  const key = item?.project_key
  if (!key) return isExploreRecord(item) ? 'Explore' : ''
  if (key === nativeProjectKey.value) return 'EXH'
  return PROJECT_FAMILIES[key] ?? key
}

// ── English labels (lists, dropdowns, alt text) ────────────────────────────

export function itemLabel(item) {
  if (!item) return ''
  return mdStrip(tr('items', item.id, defaultLang).name ?? item.internal_name ?? '')
}

export function countryLabel(countryId) {
  if (!countryId) return ''
  return tr('countries', countryId, defaultLang).name
    ?? countryById.value.get(countryId)?.internal_name
    ?? countryId
}

/** The same label from a legacy two-letter code (`uk` → United Kingdom). */
export function countryLabelFromCode(code) {
  if (!code) return ''
  const country = countryByCode.value.get(code)
  return country ? countryLabel(country.id) : code
}

export function partnerLabel(partnerId) {
  if (!partnerId) return ''
  return mdStrip(tr('partners', partnerId, defaultLang).name ?? '')
}

export function dynastyLabel(dynastyId) {
  return mdStrip(tr('dynasties', dynastyId, defaultLang).name ?? '')
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

// ── Markdown ───────────────────────────────────────────────────────────────
//
// The three renderers of viewer-core, and nothing else: a data package holds
// Markdown, every website renders it through the same pipeline, and a field
// that renders wrongly is fixed in the importer, where the data is made. The
// links a curator wrote into the exhibition's own texts by its legacy address
// are hash routes in the package now, rewritten on the way in, so nothing
// here rewrites a text either.
//
// `md` renders a record's text with its line breaks, and takes the glossary
// the sheet passes to highlight the terms it carries.

export function md(text, { glossary } = {}) {
  if (!text) return ''
  return renderBlock(text, { breaks: true, glossary })
}

export function mdInline(text, { glossary } = {}) {
  if (!text) return ''
  return renderInline(text, { glossary })
}

/**
 * A text as plain text, for an `alt`, an option label or a search index.
 */
export function mdStrip(text) {
  if (!text) return ''
  return renderPlain(text)
}

export function useExhibitionData() {
  return {
    manifest, exhibition, items, tags, partners, countries, languages,
    dynasties, glossary, timelines, timelineEvents,
    themes, aboutTheme, listedThemes, allThemeNodes, themeById, themeByBc,
    themeByRouteId, themeRouteId, romanFor, themePictures,
    themeText, pictureText, relatedContent,
    defaultLang,
    itemById, partnerById, countryById, tagById, dynastyById, glossaryById,
    timelineById, languageByCode, itemByUid,
    itemRoute, itemFromUidPath,
    partnerKey, partnerRoute, partnerObjectsRoute, partnerFromKey, visiblePartnerById,
    isInstitution, isHiddenPartner, visiblePartners,
    chromeImage,
    loadTranslations, translations, tr, availableLanguages, loadEnglish,
    itemLabel, countryLabel, countryLabelFromCode, countryByCode, partnerLabel, dynastyLabel,
    projectName, projectFamily,
    exhibitionTitle, exhibitionSubtitle, exhibitionHeadline, bannerCaption,
    siblingSites, siblingUrl,
    md, mdInline, mdStrip,
  }
}
