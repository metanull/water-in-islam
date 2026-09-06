<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  NotFoundView, citation, languageLabels, searchGlossary, sheetRows, useGlossaryPopup, useI18n,
  useRecordSheet, useRelatedRecords, useSiteConfig,
} from '@metanull/viewer-core'
import {
  GlossaryPopover, MediaGallery, RecordCredits, RecordLanguages, RecordSheet, RelatedRecords, SheetSection,
} from '@metanull/viewer-layout/content'
import {
  itemRoute, itemLabel, partnerLabel, countryLabel, partnerById, partnerRoute, dynastyById, tr, translations,
  defaultLang, md, mdInline, mdStrip, itemById, projectName as projectNameOf, projectFamily, isHiddenPartner,
} from '../composables/useExhibitionData.js'
import { findEvents, eraLabel, roundOutward, timelineCountries, countryIdForCode, hasTimeline } from '../composables/useTimeline.js'
import BackLink from '../components/BackLink.vue'

// The item sheet. The mechanics — which language the record is read in, what
// is loaded for it, the glossary terms it reaches, how a field becomes a row,
// the credits, the related records — are viewer-core's, and the rows, the
// gallery, the popover are viewer-layout's. What this page owns is the field
// specification (legacy DatabaseItem.vue's `objectData`, field for field) and
// the blocks only an exhibition has: the source database by project family,
// the portal links, the timeline tool behind the `hasTimeline` gate, the
// glossary tool, the dynasty popouts, the cross-references to sibling sites,
// the print action.

const route = useRoute()
const { t } = useI18n()
const { links } = useSiteConfig()

const item = computed(() => itemById.value.get(route.params.id) ?? null)
const era = (year) => eraLabel(year, t)

// ── Language, loads, glossary ─────────────────────────────────────────────
//
// Attribution names are language-independent, but the importer files
// `author` / `copy_editor` for EPM records on the Arabic row only (a known
// gap, recorded in the exporter's README). Legacy printed them on every
// sheet, so the platform reads them off another row when the active one has
// neither — the one place a page reads across languages, and only for
// proper names.
const {
  language: lang, languages: recordLanguages, dir, select, text: sheet, ready, terms, glossary, attribution,
} = useRecordSheet(item, {
  entity: 'items',
  translations: ['glossary', 'dynasties', 'partners'],
  attribution: ['author', 'copy_editor'],
})

const languageEntries = computed(() => languageLabels(recordLanguages.value))
const languageNameList = computed(() => languageEntries.value.map((l) => l.label).join(', '))

const { active: openTerm, onClick: onGlossaryClick, close: closeTerm } = useGlossaryPopup(terms)
const openTermHtml = computed(() => (openTerm.value ? md(openTerm.value.definition) : ''))

const partner = computed(() => (item.value ? partnerById.value.get(item.value.partner_id) : null))

// ── The field specification ───────────────────────────────────────────────
//
// Order and labels are the legacy sheet's, field for field. Empty values are
// dropped by the engine, as legacy's `filterData` did. `notice` and
// `notice_c` were never imported; `notice_b` is the image rights statement,
// imported as `extra.copyright` and rendered as the last row, where legacy
// put its own block. The labels are in the language the visitor reads the
// website in — where it differs from the record's (a deep link into a
// borrowed record in a language this exhibition does not offer) they fall
// back to English, which is where legacy pinned them anyway.
//
// Legacy shows both descriptions when both exist, with the short one
// collapsed behind a toggle; when only one exists it is relabelled plain
// "Description". EPM records are the common case of the latter.

const bothDescriptions = computed(() => Boolean(sheet.value.description) && Boolean(sheet.value.short_description))
const dynastyNames = computed(() =>
  (item.value?.dynasty_ids ?? [])
    .map((id) => translations('dynasties', lang.value)[id]?.name ?? translations('dynasties', defaultLang)[id]?.name ?? '')
    .filter(Boolean)
    .join(', '),
)

const spec = computed(() => [
  { key: 'name', label: t('sheet.field.name'), value: 'name' },
  { key: 'aka', label: t('sheet.field.alsoKnownAs'), value: 'alternate_name' },
  { key: 'location', label: t('sheet.field.location'), value: (c) => [c.text.location, countryLabel(c.record.country_id)].filter(Boolean).join(', ') },
  { key: 'museum', label: t('sheet.field.holdingMuseum'), value: () => (partner.value ? partner.value.id : ''), render: 'custom' },
  { key: 'originalOwner', label: t('sheet.field.originalOwner'), value: 'initial_owner' },
  { key: 'currentOwner', label: t('sheet.field.currentOwner'), value: 'owner' },
  { key: 'date', label: t('sheet.field.date'), value: 'dates' },
  { key: 'artist', label: t('sheet.field.artists'), value: (c) => c.record.artist_names, join: ', ' },
  { key: 'scribe', label: t('sheet.field.scribe'), value: 'scriber' },
  { key: 'workshop', label: t('sheet.field.workshop'), value: 'workshop' },
  { key: 'type', label: t('sheet.field.type'), value: 'type' },
  { key: 'inventoryNumber', label: t('sheet.field.inventoryNumber'), value: (c) => c.record.owner_reference },
  { key: 'materials', label: t('sheet.field.materials'), value: (c) => c.text.materials, join: '; ' },
  { key: 'dimensions', label: t('sheet.field.dimensions'), value: 'dimensions' },
  { key: 'dynasty', label: t('sheet.field.periodDynasty'), value: () => dynastyNames.value },
  { key: 'production', label: t('sheet.field.placeOfProduction'), value: 'place_of_production' },
  { key: 'provenance', label: t('sheet.field.provenance'), value: 'provenance' },
  { key: 'binding', label: t('sheet.field.binding'), value: 'binding_desc' },
  { key: 'description', label: t('sheet.field.description'), value: 'description', render: 'block' },
  // The only description there is, under the plain label; the toggled one
  // is the sheet component's, below.
  { key: 'shortDescription', label: t('sheet.field.description'), value: 'short_description', render: 'block', when: () => !bothDescriptions.value },
  { key: 'catalogue', label: t('sheet.field.catalogueLink'), value: 'linkcatalogs', render: 'link' },
  { key: 'obtention', label: t('sheet.field.obtentionMethod'), value: 'obtention' },
  { key: 'datation', label: t('sheet.field.datationMethod'), value: 'method_for_datation' },
  { key: 'provenanceMethod', label: t('sheet.field.provenanceMethod'), value: 'method_for_provenance' },
  { key: 'bibliography', label: t('sheet.field.bibliography'), value: 'bibliography', render: 'block' },
  { key: 'copyright', label: t('sheet.field.copyrightInformation'), value: 'copyright' },
])
const rows = computed(() =>
  item.value ? sheetRows(spec.value, { record: item.value, text: sheet.value, glossary: glossary.value }) : [],
)
const shortDescription = computed(() =>
  bothDescriptions.value ? { html: md(sheet.value.short_description, { glossary: glossary.value }) } : null,
)

// ── Credits and citation ──────────────────────────────────────────────────

const preparedBy = computed(() => sheet.value.author ?? attribution.value.author ?? '')
const copyEditedBy = computed(() => sheet.value.copy_editor ?? attribution.value.copy_editor ?? '')
const credits = computed(() =>
  [
    [t('sheet.field.preparedBy'), preparedBy.value],
    [t('sheet.field.copyeditedBy'), copyEditedBy.value],
    [t('sheet.field.translationBy'), sheet.value.translator],
    [t('sheet.field.translationCopyeditedBy'), sheet.value.translation_copy_editor],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value })),
)
// Legacy's `#info-project-name`: the exhibition's own title for a native
// member, the source project's name for a borrowed one, nothing for a record
// legacy left nameless.
const sourceProject = computed(() => projectNameOf(item.value))
const citationText = computed(() =>
  item.value
    ? citation({ author: preparedBy.value, name: sheet.value.name, project: sourceProject.value, inWord: t('record.citation.in') })
    : '',
)

// The projects legacy offers a "search the related database" link for. DCA is
// deliberately not among them: legacy has no public DCA database search to
// point at, so a DCA-sourced member gets no such link at all.
const RELATED_DATABASE_PROJECTS = new Set(['ISL', 'EPM', 'DBA', 'BAR', 'AWE', 'awe'])
const hasRelatedDatabase = computed(() => RELATED_DATABASE_PROJECTS.has(item.value?.project_key))
const showEiacNotice = computed(() => item.value?.project_key === 'EPM')

// ── Photos ────────────────────────────────────────────────────────────────

const photos = computed(() =>
  [...(item.value?.images ?? [])]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((p) => ({
      url: p.url,
      alt: itemLabel(item.value),
      caption: p.captions?.[lang.value] ?? p.captions?.[defaultLang] ?? '',
      photographer: p.photographer ?? '',
      copyright: p.copyright ?? '',
    })),
)

// ── Related content ───────────────────────────────────────────────────────
//
// Decision Q3: none of these become a constructed URL. A related item the
// package holds opens locally; one it does not is shown as the reference it
// is; a sibling site is linked only where the import carried a host.

const related = useRelatedRecords(item, { entity: 'items', language: lang })
const relatedRows = computed(() =>
  related.value.inPackage
    .filter(({ record }) => itemById.value.has(record.id))
    .map(({ record, justification }) => ({
      id: record.id,
      image: record.images?.[0]?.url ?? '',
      imageAlt: itemLabel(record),
      name: mdInline(tr('items', record.id, defaultLang).name ?? record.internal_name ?? ''),
      meta: [countryLabel(record.country_id), justification ? mdStrip(justification) : ''].filter(Boolean),
      to: itemRoute(record),
    })),
)
const relatedOutside = computed(() =>
  (item.value?.related_items ?? []).filter((r) => !r.in_package || !itemById.value.has(r.id)),
)
const byName = (a, b) => (a.name ?? '').localeCompare(b.name ?? '')
const galleryRefs = computed(() => (item.value?.gallery_references ?? []).filter((g) => g.kind === 'gallery').sort(byName))
// Legacy suppressed every exhibition link whose host was
// exhibitions.museumwnf.org; decision Q3 says outbound links are not
// dropped, so they are shown here.
const exhibitionRefs = computed(() => (item.value?.gallery_references ?? []).filter((g) => g.kind === 'exhibition').sort(byName))

// Popouts: timeline, glossary tool, one per dynasty.
const openPopup = ref(null)
function togglePopup(which) {
  openPopup.value = openPopup.value === which ? null : which
  closeTerm()
}

const dynastyEntries = computed(() =>
  (item.value?.dynasty_ids ?? [])
    .map((id) => {
      const translated = translations('dynasties', lang.value)[id] ?? translations('dynasties', defaultLang)[id] ?? {}
      return { id, record: dynastyById.value.get(id), ...translated }
    })
    .filter((d) => d.history),
)

const timelineCountry = ref('')
watch(item, (it) => { timelineCountry.value = it ? (countryCodeOf(it.country_id) ?? 'all') : 'all' }, { immediate: true })
function countryCodeOf(countryId) {
  for (const [code] of timelineCountries.value) {
    if (countryIdForCode(code) === countryId) return code
  }
  return null
}
const itemRange = computed(() => roundOutward(item.value?.start_date, item.value?.end_date))
const itemEvents = computed(() => {
  const [from, to] = itemRange.value
  if (from == null) return []
  return findEvents({ countryCode: timelineCountry.value, start: from, end: to })
})

const glossaryInput = ref('')
const glossaryMatches = computed(() => searchGlossary(glossaryInput.value, lang.value))
const selectedGlossary = ref(null)

// Legacy's "As PDF (including images)" was the browser's own print dialog.
function printSheet() {
  window.print()
}
</script>

<template>
  <div id="database-page-wrapper" v-if="item">
    <div id="languages">
      <RecordLanguages :languages="languageEntries" :language="lang" @select="select" />
    </div>

    <BackLink />

    <div v-if="!ready" class="loader">{{ $t('core.status.loading') }}</div>

    <div v-else id="database-object-wrapper" :dir="dir">
      <div id="photo-info-wrapper">
        <div id="photo-container">
          <MediaGallery :images="photos" />

          <div id="links-container">
            <!-- Decision Q3: legacy's `remote-object` URL came from a
                 hand-maintained table with no counterpart in the new model, so
                 the source is named, not linked. The chip is keyed by project
                 FAMILY, as legacy's `#info-citation-link` class is, and the
                 source line is dropped when legacy has no project name to print. -->
            <p id="source-reference" v-if="projectFamily(item)">
              <span class="project-chip" :class="`project-${projectFamily(item)}`">{{ item.project_key || projectFamily(item) }}</span>
              <template v-if="sourceProject">{{ t('record.sheet.sourceDatabase') }}: {{ sourceProject }}</template>
            </p>
            <p id="source-uid"><code>{{ item.backward_compatibility }}</code></p>
            <p id="add-collection-link">
              <a :href="links.myCollection" target="_blank" rel="noopener">↗ {{ t('record.action.addToCollection') }}</a>
            </p>
          </div>
        </div>

        <div id="info-container" @click="onGlossaryClick">
          <div id="info-eiac" v-if="showEiacNotice">
            {{ t('exhibition.item.explorePartnerNote') }} <strong><em>{{ languageNameList }}</em></strong>
          </div>

          <RecordSheet :rows="rows" layout="list" :short-description="shortDescription" short-description-after="description">
            <!-- E6: a hidden museum keeps its name on the sheet and loses the
                 link, because it has no page to link to. -->
            <template #museum>
              <RouterLink v-if="!isHiddenPartner(partner)" :to="partnerRoute(partner)">{{ partnerLabel(item.partner_id) }}</RouterLink>
              <span v-else>{{ partnerLabel(item.partner_id) }}</span>
            </template>
          </RecordSheet>

          <RecordCredits
            :credits="credits"
            :working-number="item.mwnf_reference ?? ''"
            :working-number-label="t('sheet.field.workingNumber')"
            :citation="citationText"
            :citation-heading="t('record.citation.ofThisPage')"
          />
        </div>
      </div>

      <!-- ── Related content ────────────────────────────────────────────── -->
      <div id="related-content-container">
        <p class="related-header related-header--caps">{{ $t('exhibition.related.title') }}</p>
        <p id="related-description">{{ t('exhibition.related.description') }}</p>

        <RelatedRecords :heading="t('exhibition.related.objects')" :records="relatedRows" variant="grid" :action-label="t('exhibition.action.seeDatabaseEntry')">
          <!-- Related items this exhibition does not ship: the reference it is, awaiting a resolver. -->
          <ul v-if="relatedOutside.length" class="reference-list">
            <li v-for="r in relatedOutside" :key="r.id">
              <span class="project-chip" :class="`project-${projectFamily(r)}`">{{ r.project_key || projectFamily(r) }}</span>
              <code>{{ r.backward_compatibility }}</code>
              <span class="unresolved-note">{{ $t('exhibition.results.notInThisExhibition') }}</span>
            </li>
          </ul>
        </RelatedRecords>

        <!-- Artistic Introduction — an Islamic Art site feature legacy linked from ISL/EPM sheets. -->
        <div v-if="item.project_key === 'ISL' || item.project_key === 'EPM'">
          <p class="related-line">
            <a :href="`${links.islamicArt}/gai/ISL/`" target="_blank" rel="noopener">↗ {{ t('exhibition.nav.artisticIntroduction') }}</a>
          </p>
        </div>

        <!-- Timeline for this item. Withheld entirely when the exhibition
             reports no chronology: legacy prints no "timeline" anywhere on the
             sheet in that case, not merely a nav entry short. -->
        <div v-if="hasTimeline && (itemEvents.length || itemRange[0] != null)">
          <p class="related-line clickable" @click="togglePopup('timeline')">➤ {{ t('record.related.timelineForItem') }}</p>
          <div class="popout" v-if="openPopup === 'timeline'" dir="ltr">
            <div class="popout-close" @click="openPopup = null">✕</div>
            <div class="popout-title">{{ $t('exhibition.section.timeline') }}</div>
            <div class="popout-option">
              <label>{{ $t('exhibition.timeline.searchIntro') }}</label>
              <select v-model="timelineCountry">
                <option v-for="c in timelineCountries" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
              </select>
              <RouterLink
                class="popout-full-link"
                :to="{ name: 'timeline-results', query: { c: timelineCountry, start: itemRange[0], end: itemRange[1] } }"
              >➤ {{ $t('exhibition.timeline.beginFullSearch') }}</RouterLink>
            </div>
            <div class="popout-scroll">
              <div class="popout-subheader">
                {{ timelineCountries.find(c => c[0] === timelineCountry)?.[1] }},
                {{ era(itemRange[0]) }} – {{ era(itemRange[1]) }}
              </div>
              <div v-if="!itemEvents.length" class="popout-empty">{{ $t('exhibition.timeline.noEvents') }}</div>
              <div class="timeline-event" v-for="event in itemEvents" :key="event.id">
                <div class="timeline-date">{{ era(event.year_from) }}</div>
                <div v-html="md(event.text.description)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Glossary tool -->
        <div>
          <p class="related-line clickable" @click="togglePopup('glossaryTool')">➤ {{ t('record.glossary.heading') }}</p>
          <div class="popout" v-if="openPopup === 'glossaryTool'">
            <div class="popout-close" @click="openPopup = null">✕</div>
            <div class="popout-title">{{ t('record.glossary.heading') }}</div>
            <div class="popout-instructions">{{ t('record.glossary.instructions') }}</div>
            <input class="glossary-input" type="text" v-model="glossaryInput" />
            <ul class="glossary-list" v-if="glossaryInput && !selectedGlossary">
              <li v-for="hit in glossaryMatches" :key="hit.id" @click="selectedGlossary = hit; glossaryInput = hit.spelling">{{ hit.spelling }}</li>
            </ul>
            <div class="popout-scroll" v-if="selectedGlossary">
              <p class="info-label">{{ t('record.glossary.definition') }}</p>
              <div v-html="md(selectedGlossary.definition)"></div>
            </div>
          </div>
        </div>

        <!-- Dynasties -->
        <div v-if="dynastyEntries.length">
          <p class="related-sub">{{ t('exhibition.nav.islamicDynasties') }}</p>
          <div v-for="dynasty in dynastyEntries" :key="dynasty.id">
            <p class="related-line clickable" @click="togglePopup(`dynasty:${dynasty.id}`)">➤ {{ dynasty.name }}</p>
            <div class="popout" v-if="openPopup === `dynasty:${dynasty.id}`">
              <div class="popout-close" @click="openPopup = null">✕</div>
              <div class="popout-title">{{ t('exhibition.nav.dynastiesHeading') }}</div>
              <div class="popout-scroll">
                <div class="dynasty-name">{{ dynasty.name }}</div>
                <p v-if="dynasty.also_known_as">{{ dynasty.also_known_as }}</p>
                <p v-if="dynasty.area">{{ dynasty.area }}</p>
                <p v-if="dynasty.record?.from_ad != null">
                  AH {{ dynasty.record.from_ah }}–{{ dynasty.record.to_ah }} /
                  AD {{ dynasty.record.from_ad }}–{{ dynasty.record.to_ad }}
                </p>
                <div v-html="md(dynasty.history)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Audio / video -->
        <SheetSection v-if="item.media?.length" :heading="t('record.related.audioVideo')">
          <p class="related-line" v-for="file in item.media" :key="file.url">
            <a :href="file.url" target="_blank" rel="noopener">↗ {{ file.title ?? file.url }}</a>
          </p>
        </SheetSection>

        <!-- On display in -->
        <div v-if="galleryRefs.length || exhibitionRefs.length">
          <p class="related-header">{{ t('record.related.onDisplayIn') }}</p>
          <div v-if="exhibitionRefs.length">
            <p class="related-sub">{{ t('record.related.exhibitions') }}</p>
            <p class="related-line" v-for="ref in exhibitionRefs" :key="ref.id">
              <a v-if="ref.legacy_host" :href="ref.legacy_host" target="_blank" rel="noopener">↗ {{ ref.name }}</a>
              <span v-else>{{ ref.name }} <span class="unresolved-note">{{ $t('exhibition.item.linkPending') }}</span></span>
            </p>
          </div>
          <div v-if="galleryRefs.length">
            <p class="related-sub">{{ t('record.related.galleries') }}</p>
            <p class="related-line" v-for="ref in galleryRefs" :key="ref.id">
              <a v-if="ref.legacy_host" :href="ref.legacy_host" target="_blank" rel="noopener">↗ {{ ref.name }}</a>
              <span v-else>{{ ref.name }} <span class="unresolved-note">{{ $t('exhibition.item.linkPending') }}</span></span>
            </p>
          </div>
        </div>

        <!-- Search related database: the gate is on the block, as legacy's was. -->
        <div v-if="hasRelatedDatabase">
          <p class="related-header">{{ t('exhibition.search.relatedDatabase') }}</p>
          <p class="related-line" v-if="item.project_key === 'ISL' || item.project_key === 'EPM'">
            <a :href="`${links.islamicArt}/database.php`" target="_blank" rel="noopener">↗ {{ $t('core.project.islamicArt') }}</a>
          </p>
          <p class="related-line" v-if="item.project_key === 'DBA' || item.project_key === 'BAR'">
            <a :href="`${links.baroqueArt}/database.php`" target="_blank" rel="noopener">↗ {{ $t('core.project.baroqueArt') }}</a>
          </p>
          <p class="related-line" v-if="item.project_key === 'AWE' || item.project_key === 'awe'">
            <a :href="`${links.sharingHistory}/database.php`" target="_blank" rel="noopener">↗ {{ $t('core.project.sharingHistory') }}</a>
          </p>
        </div>

        <!-- The portal search sits outside that gate in legacy too. -->
        <div>
          <p class="related-header">{{ t('exhibition.search.overallDatabase') }}</p>
          <p class="related-line">
            <a :href="links.overallDatabase" target="_blank" rel="noopener">↗ {{ t('exhibition.nav.overallDatabase') }}</a>
          </p>
        </div>

        <div>
          <p class="related-header">{{ t('record.action.download') }}</p>
          <p class="related-line clickable" @click="printSheet()">➤ {{ t('record.action.downloadPdf') }}</p>
        </div>
      </div>
    </div>

    <GlossaryPopover :term="openTerm" :html="openTermHtml" :dir="dir" @close="closeTerm" />
  </div>
  <NotFoundView v-else />
</template>

<style scoped>
#database-page-wrapper { background: #fff; width: 100%; min-height: 400px; }

#languages { background: var(--rule-grey); padding: 6px 20px; }

#database-object-wrapper { padding: 0 20px 30px; }
#photo-info-wrapper { display: flex; gap: 26px; align-items: flex-start; }
#photo-container { flex: 0 0 42%; max-width: 42%; }

#links-container { padding-top: 14px; font-size: 14px; }
#links-container p { margin-bottom: 6px; }
#source-uid code { font-size: 12px; color: #666; word-break: break-all; }
#add-collection-link a { color: var(--link-blue); }

#info-container { flex: 1; min-width: 0; padding-top: 14px; }
#info-eiac {
  background: var(--rule-grey);
  padding: 10px 12px;
  margin-bottom: 14px;
  font-size: 13px;
}
.info-label { font-weight: 700; color: var(--main-color); margin-top: 12px; }
#info-container :deep(.mwnf-sheet__value a) { color: var(--link-blue); }

#related-content-container { margin-top: 30px; border-top: 3px solid var(--contrast-color); padding-top: 16px; }
.related-header {
  font-weight: 700;
  color: var(--main-color);
  font-size: 16px;
  margin-top: 18px;
  border-bottom: 1px solid var(--rule-grey);
}
.related-header--caps { text-transform: uppercase; }
.related-sub { font-weight: 700; margin-top: 12px; }
#related-description { font-size: 13px; color: #555; margin-top: 6px; }
.related-line { margin-top: 6px; }
.related-line a { color: var(--link-blue); }
.related-line.clickable { color: var(--main-color); cursor: pointer; }
.related-line.clickable:hover { text-decoration: underline; }

.reference-list { list-style: none; margin-top: 6px; }
.reference-list li { padding: 3px 0; font-size: 13px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.reference-list code { color: #555; }
.unresolved-note { color: #8a8a8a; font-style: italic; font-size: 12px; }

.popout {
  position: relative;
  background: #fff;
  border: 2px solid var(--contrast-color);
  margin: 8px 0 14px;
  max-width: 640px;
}
.popout-close {
  position: absolute;
  top: 4px;
  inset-inline-end: 8px;
  cursor: pointer;
  color: #fff;
  font-size: 16px;
  z-index: 2;
}
.popout-title { background: var(--main-color); color: var(--main-text-color); padding: 6px 12px; font-weight: 700; }
.popout-instructions { padding: 8px 12px; font-size: 13px; }
.popout-option { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; }
.popout-option select { font-family: inherit; padding: 3px; }
.popout-full-link { color: var(--link-blue); }
.popout-scroll { max-height: 320px; overflow: auto; padding: 10px 12px; font-size: 14px; }
.popout-subheader { font-weight: 700; margin-bottom: 8px; }
.popout-empty { color: #777; font-style: italic; }
.timeline-event { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid #eee; }
.timeline-date { flex: 0 0 90px; font-weight: 700; }
.dynasty-name { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
.glossary-input { width: calc(100% - 24px); margin: 0 12px 8px; padding: 5px; font-family: inherit; border: 1px solid var(--rule-grey); }
.glossary-list { list-style: none; margin: 0 12px 10px; max-height: 180px; overflow: auto; border: 1px solid var(--rule-grey); }
.glossary-list li { padding: 4px 8px; cursor: pointer; }
.glossary-list li:hover { background: var(--rule-grey); }

@media only screen and (max-width: 849px) {
  #photo-info-wrapper { flex-direction: column; }
  #photo-container { max-width: 100%; flex: none; width: 100%; }
}
</style>
