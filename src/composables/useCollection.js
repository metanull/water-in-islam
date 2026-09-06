import { useI18n } from '@metanull/viewer-core'
import {
  countries, countryById, tagById, tags,
  countryLabel, itemLabel, itemRoute, partnerLabel, tr, defaultLang, mdInline, projectName,
} from './useExhibitionData.js'

// The catalogue spec: what this exhibition's lists filter and search on. The
// engine — query state, options, dates, pages, the boolean grammar — is
// viewer-core's; what is declared here is only what is this exhibition's:
// the facets and what the URL carries for them, the date rule, the page
// size, the haystack the search bar reads, and the tile a record becomes.
//
// Legacy asked the API for everything: `/items?ic[]=…&id[]=…&na=…&nz=…` for
// the results, and `/items/countries`, `/items/tags`, `/items/years` *with
// the same filters applied* for the dropdowns — which is what made the
// facets dependent (pick a country, and the type list shrinks to the types
// still reachable). The results page hands the engine the matching subset
// for that reason; the entrance hands it everything.

/** Nine tiles a page, as legacy's grids showed. */
export const PAGE_SIZE = 9

/**
 * Decision D5: the DXA sites test containment — `na <= start_date` and
 * `nz >= coalesce(end_date, start_date)` in `Objects.blade.php` — so an
 * undated record is out the moment a bound is set.
 */
export const DATE_MODE = 'contain'

// The five THG facet categories, in the order the legacy form shows them.
// `artist` has no dropdown in dxa-client, but the category exists in the data
// and the exporter ships it, so it renders whenever it has a value — a
// superset of legacy, never a different answer.
export const FACET_CATEGORIES = ['type', 'dynasty', 'subject', 'material', 'artist']

/**
 * The heading each facet dropdown carries. Every name is written out so
 * `viewer-i18n-check` can see the five it asks for.
 */
export function useFacetLabels() {
  const { t } = useI18n()
  return {
    type: t('catalogue.facet.type'),
    dynasty: t('catalogue.facet.periodDynasty'),
    subject: t('catalogue.facet.subject'),
    material: t('catalogue.facet.material'),
    artist: t('catalogue.facet.artist'),
  }
}

// ── What the URL carries ───────────────────────────────────────────────────
//
// The legacy 2-letter country code for `country`, the legacy tag id for a
// facet: the values legacy's URLs carried, so a link shared then still
// resolves now.

export function countryIdForCode(code) {
  return code ? (countries.value ?? []).find((c) => c.code === code)?.id ?? null : null
}

export function tagIdForLegacy(legacyId) {
  return legacyId ? (tags.value ?? []).find((t) => t.legacy_tag_id === legacyId)?.id ?? null : null
}

export function tagLabelForLegacy(legacyId) {
  return (tags.value ?? []).find((t) => t.legacy_tag_id === legacyId)?.label ?? legacyId
}

/**
 * The facet spec for viewer-core's `useFacets`: the country by code, each
 * tag category by legacy id, labels upper-cased on the first letter as
 * legacy printed them.
 */
export const FACETS = {
  country: {
    values: (item) => countryById.value.get(item.country_id)?.code ?? null,
    label: (code) => countryLabel(countryIdForCode(code)),
  },
  ...Object.fromEntries(
    FACET_CATEGORIES.map((category) => [
      category,
      {
        values: (item) =>
          (item.tag_ids ?? [])
            .map((id) => tagById.value.get(id))
            .filter((tag) => tag && tag.category === category)
            .map((tag) => tag.legacy_tag_id),
        label: tagLabelForLegacy,
        capitalize: true,
      },
    ]),
  ),
}

/** The legacy `/items` predicate's tag half: every requested tag, ANDed. */
export function hasEveryTag(item, tagIds) {
  return tagIds.every((id) => item.tag_ids?.includes(id))
}

// ── The search bar ─────────────────────────────────────────────────────────
//
// Legacy ran MySQL boolean full-text search over the English sheet; the
// haystack is the same set of fields, and the grammar is viewer-core's.

export function haystack(item, text) {
  return [
    text.name, text.description, text.short_description, text.type, text.holder, text.dates,
    text.location, text.provenance, text.alternate_name, text.place_of_production,
    ...(text.keywords ?? []), ...(text.materials ?? []),
    item.internal_name, item.owner_reference, item.mwnf_reference,
    partnerLabel(item.partner_id), countryLabel(item.country_id),
  ]
}

// ── The tile ───────────────────────────────────────────────────────────────

/**
 * Records as viewer-layout's grid contract: the thumbnail, the name, the
 * lines legacy's hover card carried (date, holder, place, source project).
 * The project name is this exhibition's own rule — the exhibition's title
 * for a native member, nothing for a record legacy left nameless — so the
 * line is dropped, not printed with a hole in it.
 */
export function useGridRecords() {
  const { t } = useI18n()
  return (list) =>
    list.map((item) => {
      const text = tr('items', item.id, defaultLang)
      const project = projectName(item)
      return {
        id: item.id,
        image: item.images?.[0]?.url ?? '',
        imageAlt: itemLabel(item),
        name: mdInline(text.name ?? item.internal_name ?? ''),
        meta: [
          text.dates ?? '',
          partnerLabel(item.partner_id),
          [text.location, countryLabel(item.country_id)].filter(Boolean).join(', '),
          project ? `${t('catalogue.results.forProject')} ${project}` : '',
        ].filter(Boolean),
        to: itemRoute(item),
      }
    })
}
