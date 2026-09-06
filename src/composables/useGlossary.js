import { glossaryEntries } from '@metanull/viewer-core'
import { glossaryById, translations } from './useExhibitionData.js'

// The theme pages highlight glossary terms inside curated text. The item
// sheet no longer needs this module: what it reaches is recorded on the item
// (`glossary_ids`), and viewer-core's `useRecordSheet` builds its terms and
// its popover from that. Curated theme text has no such column — legacy asked
// the API for `…/themes/<id>/items/<n>/glossary`, which ran the same match
// server-side — so the candidate set here is the whole glossary, filtered
// down by what the text contains. A package's glossary is small enough that
// scanning all of it costs nothing.

/**
 * Glossary terms that actually occur in a block of theme text, with their
 * spellings in `lang`. Falls back to the English spellings when the term has
 * no row in `lang`.
 */
export function termsForText(text, lang) {
  if (!text) return []
  const haystack = String(text).toLowerCase()
  const rows = translations('glossary', lang)
  const fallback = translations('glossary', 'en')
  const out = []
  for (const [id, entry] of glossaryById.value) {
    const t = rows[id] ?? fallback[id] ?? {}
    const spellings = (t.spellings ?? []).map((s) => String(s).trim()).filter(Boolean)
    const words = spellings.length ? spellings : [entry.word]
    if (!words.some((w) => w && haystack.includes(w.toLowerCase()))) continue
    out.push({ id, word: entry.word, definition: t.definition ?? '', spellings: words })
  }
  return out
}

/** The spelling list viewer-core's renderers highlight: one entry per spelling of each term. */
export const glossaryFor = glossaryEntries
