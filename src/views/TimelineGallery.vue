<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { dateRange, eraLabel, sortChronological, useI18n, useListQuery, usePagination } from '@metanull/viewer-core'
import { Pagination, RecordGrid } from '@metanull/viewer-layout/content'
import { items, labelOf } from '../composables/useExhibitionData.js'
import { PAGE_SIZE, useGridRecords } from '../composables/useCollection.js'
import { countryIdForCode } from '../composables/useTimeline.js'
import BackLink from '../components/BackLink.vue'

// The member items whose dates overlap the timeline search's country and
// period. Legacy asked `/items` for this; here it is the same join, done
// client-side, which is exactly what the package spec anticipated
// ("the timeline-gallery page joins events to member items by country + year
// range client-side"). Overlap, not containment: a period is a window on the
// chronology, and an object made across its edge belongs in it.
const { t } = useI18n()
const era = (year) => eraLabel(year, t)
const gridRecords = useGridRecords()

// The country and the period travel in the query, like every filter; an
// absent bound is an open one.
const { filters, page, goToPage } = useListQuery({ keys: ['country', 'start', 'end'] })
const countryId = computed(() => countryIdForCode(filters.country || 'all'))
const start = computed(() => (filters.start ? Number(filters.start) : null))
const end = computed(() => (filters.end ? Number(filters.end) : null))

const matching = computed(() => {
  let list = (items.value ?? []).filter((i) => Number.isFinite(i.start_date) && (!countryId.value || i.country_id === countryId.value))
  list = dateRange(list, { begin: filters.start, end: filters.end, mode: 'overlap' })
  return sortChronological(list, { undated: 'first' })
})

const pageInfo = usePagination(matching, { page, size: PAGE_SIZE })
const rows = computed(() => gridRecords(pageInfo.value.rows))
</script>

<template>
  <div id="timeline-gallery-container">
    <BackLink />

    <div id="gallery-header">
      <p>
        {{ $t('timeline.results.galleryHeading') }} |
        <span>{{ countryId ? labelOf('countries', countryId) : $t('timeline.form.allCountries') }}</span>
        <span v-if="start != null || end != null">
          | {{ start != null ? era(start) : $t('timeline.form.earliest') }}
          {{ $t('timeline.form.to') }}
          {{ end != null ? era(end) : $t('timeline.form.latest') }}
        </span>
      </p>
      <p>{{ pageInfo.total }} {{ $t('catalogue.results.objects') }}</p>
      <p class="back-to-events">
        <RouterLink :to="{ name: 'timeline-results', query: { c: filters.country || 'all', start: filters.start, end: filters.end } }">
          ➤ {{ $t('timeline.nav.backToEvents') }}
        </RouterLink>
      </p>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />

    <div id="content-container">
      <RecordGrid :records="rows" :action-label="$t('exhibition.action.seeDatabaseEntry')">
        <template #empty><p class="no-results">{{ $t('exhibition.results.noObjectsInPeriod') }}</p></template>
      </RecordGrid>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />
  </div>
</template>

<style scoped>
#timeline-gallery-container { background: #fff; width: 100%; min-height: 400px; padding-bottom: 30px; }
#gallery-header { padding: 0 20px 12px; }
#gallery-header span { font-weight: 700; }
.back-to-events a { color: var(--link-blue); font-size: 13px; }
.pages { padding-inline: 20px; }
#content-container { padding: 0 20px; }
.no-results { padding: 30px 0; }
</style>
