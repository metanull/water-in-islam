<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  dateRange, sortChronological, useFacets, useI18n, useListQuery, usePagination, yearBuckets,
} from '@metanull/viewer-core'
import { FacetSelect, FilterPanel, Pagination, RecordGrid, ResultsSummary } from '@metanull/viewer-layout/content'
import { items, countryLabel, timelines } from '../composables/useExhibitionData.js'
import {
  DATE_MODE, FACETS, FACET_CATEGORIES, PAGE_SIZE, countryIdForCode, hasEveryTag, tagIdForLegacy,
  tagLabelForLegacy, useFacetLabels, useGridRecords,
} from '../composables/useCollection.js'
import { hasTimeline } from '../composables/useTimeline.js'
import BackLink from '../components/BackLink.vue'

// Results plus "filter further by". The filters travel in the URL, read by
// viewer-core; the dependent options are the point: every dropdown is rebuilt
// from the items that survive the *current* filter set, so picking a country
// shrinks the type list, exactly as legacy's re-queries did.
const router = useRouter()
const { t } = useI18n()
const labels = useFacetLabels()
const gridRecords = useGridRecords()

const KEYS = ['country', ...FACET_CATEGORIES, 'start', 'end']
const { filters, page, apply, goToPage } = useListQuery({ keys: KEYS })

const matching = computed(() => {
  const countryId = countryIdForCode(filters.country)
  const tagIds = FACET_CATEGORIES.map((c) => tagIdForLegacy(filters[c])).filter(Boolean)
  let list = (items.value ?? []).filter((item) => {
    if (filters.country && item.country_id !== countryId) return false
    return hasEveryTag(item, tagIds)
  })
  list = dateRange(list, { begin: filters.start, end: filters.end, mode: DATE_MODE })
  return sortChronological(list, { undated: 'first' })
})

const pageInfo = usePagination(matching, { page, size: PAGE_SIZE })
const rows = computed(() => gridRecords(pageInfo.value.rows))

const options = useFacets(matching, FACETS)
const years = computed(() => yearBuckets(matching.value, t))

const resultsExist = computed(() => matching.value.length > 0)
const isFirstSearch = computed(() => KEYS.filter((k) => filters[k]).length <= 1)

// The filter summary line legacy printed as "Collection | <selections>".
const filterSummary = computed(() => {
  const parts = []
  if (filters.country) parts.push(countryLabel(countryIdForCode(filters.country)))
  for (const key of FACET_CATEGORIES) if (filters[key]) parts.push(tagLabelForLegacy(filters[key]))
  if (filters.start) parts.push(`${t('catalogue.filter.from')} ${filters.start}`)
  if (filters.end) parts.push(`${t('catalogue.filter.to')} ${filters.end}`)
  return parts.filter(Boolean).join(' | ')
})

const summary = computed(() => [
  { label: t('exhibition.section.collection'), value: filterSummary.value },
  { count: pageInfo.value.total, value: `${t('catalogue.results.outOf')} ${(items.value ?? []).length} ${t('catalogue.results.objects')}` },
])

// Choosing navigates, and a reset is the entrance again.
function choose(key, value) {
  apply({ [key]: value })
}
function resetFilters() {
  router.push({ name: 'collection' })
}

// "Timeline for this Search" — legacy offered it whenever the chosen country
// actually has a chronology. The global timeline ships in every package
// whatever its flags say, so the check is a lookup rather than a request —
// a Set of `country_id`, so the countries served by both chronologies count
// once. `hasTimeline` comes first, and it is not redundant with that lookup:
// the worldwide chronology ships here too, so every country it covers would
// otherwise offer the link on a site whose Timeline section legacy withholds.
const timelineCountryIds = computed(() => new Set((timelines.value ?? []).map((tl) => tl.country_id)))
const showTimelineLink = computed(() => {
  if (!hasTimeline.value) return false
  const id = countryIdForCode(filters.country)
  return Boolean(id && timelineCountryIds.value.has(id))
})
</script>

<template>
  <div id="collection-results-container">
    <BackLink />

    <div id="info-container">
      <ResultsSummary :parts="summary" />
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />

    <div id="content-container">
      <div id="collection-results" v-if="resultsExist">
        <RecordGrid :records="rows" :action-label="$t('exhibition.action.seeDatabaseEntry')" />
      </div>
      <!-- Was "No results. Click here to reset all filters.", with the link
           inside the sentence. The message stands on its own and the action is
           the button beside it, because a text is not something to thread a
           control through. -->
      <div id="no-results" v-else>
        {{ $t('catalogue.results.noResults') }}
        <button class="linkish" @click="resetFilters()">{{ $t('catalogue.results.resetFilters') }}</button>
      </div>

      <aside id="options-container">
        <FilterPanel
          mode="immediate"
          :title="isFirstSearch ? $t('catalogue.facet.filterBy') : $t('catalogue.facet.filterFurtherBy')"
          :reset-label="$t('catalogue.results.resetFilters')"
          :disabled="!resultsExist"
          @reset="resetFilters()"
        >
          <FacetSelect
            :model-value="filters.country"
            :options="options.country"
            :placeholder="$t('catalogue.facet.selectCountry')"
            @update:model-value="choose('country', $event)"
          />
          <FacetSelect
            v-for="category in FACET_CATEGORIES"
            :key="category"
            :model-value="filters[category]"
            :options="options[category]"
            :placeholder="labels[category]"
            hide-empty
            @update:model-value="choose(category, $event)"
          />
          <div id="date-wrapper">
            <FacetSelect :model-value="filters.start" :options="years" :placeholder="$t('catalogue.facet.startDate')" @update:model-value="choose('start', $event)" />
            <FacetSelect :model-value="filters.end" :options="years" :placeholder="$t('catalogue.facet.endDate')" @update:model-value="choose('end', $event)" />
          </div>
        </FilterPanel>

        <div id="timeline-link-box" v-if="showTimelineLink">
          <div class="options-label">{{ $t('catalogue.results.timelineForSearch') }}</div>
          <p>
            ➤
            <RouterLink :to="{ name: 'timeline-results', query: { c: filters.country, start: filters.start, end: filters.end } }">
              {{ $t('exhibition.section.timeline') }} | {{ countryLabel(countryIdForCode(filters.country)) }}
            </RouterLink>
          </p>
        </div>
      </aside>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />
  </div>
</template>

<style scoped>
#collection-results-container { background: #fff; width: 100%; min-height: 400px; }
#info-container { padding: 0 20px 12px; font-size: 15px; }
.pages { padding-inline: 20px; }
#content-container { display: flex; gap: 20px; padding: 0 20px 20px; align-items: flex-start; }
#collection-results { flex: 1; min-width: 0; }
#no-results { flex: 1; padding: 40px 0; }
.linkish { background: none; border: none; color: var(--link-blue); text-decoration: underline; cursor: pointer; font: inherit; }
#options-container { flex: 0 0 260px; }
#date-wrapper { display: flex; gap: 8px; }
#date-wrapper > * { flex: 1; min-width: 0; }
.options-label { font-weight: 700; margin-bottom: 4px; }
#timeline-link-box { margin-top: 16px; background: var(--rule-grey); padding: 14px; }
#timeline-link-box a { color: var(--link-blue); }

@media only screen and (max-width: 849px) {
  #content-container { flex-direction: column; }
  #options-container { flex: none; width: 100%; }
}
</style>
