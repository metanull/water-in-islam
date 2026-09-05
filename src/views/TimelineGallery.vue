<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { items, countryLabel } from '../composables/useExhibitionData.js'
import { sortChronological, paginate } from '../composables/useCollection.js'
import { countryIdForCode, eraLabel } from '../composables/useTimeline.js'
import { useI18n } from '@metanull/viewer-core'
import ObjectGrid from '../components/ObjectGrid.vue'
import PageLinks from '../components/PageLinks.vue'
import BackLink from '../components/BackLink.vue'

// The member items whose dates overlap the timeline search's country and
// period. Legacy asked `/items` for this; here it is the same join, done
// client-side, which is exactly what the package spec anticipated
// ("the timeline-gallery page joins events to member items by country + year
// range client-side").
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const era = (year) => eraLabel(year, t)

const countryId = computed(() => countryIdForCode(String(route.query.country ?? 'all')))
const start = computed(() => (route.query.start ? Number(route.query.start) : null))
const end = computed(() => (route.query.end ? Number(route.query.end) : null))

const matching = computed(() => sortChronological(items.value.filter(i => {
  if (countryId.value && i.country_id !== countryId.value) return false
  const itemStart = i.start_date
  const itemEnd = i.end_date ?? i.start_date
  if (!Number.isFinite(itemStart)) return false
  if (start.value != null && itemEnd < start.value) return false
  if (end.value != null && itemStart > end.value) return false
  return true
})))

const page = computed(() => paginate(matching.value, route.query.page ?? 1))

function navigate(p) {
  router.push({ name: 'timeline-gallery', query: { ...route.query, page: p } })
}
</script>

<template>
  <div id="timeline-gallery-container">
    <BackLink />

    <div id="gallery-header">
      <p>
        {{ $t('exhibition.timeline.galleryHeading') }} |
        <span>{{ countryId ? countryLabel(countryId) : $t('exhibition.timeline.allCountries') }}</span>
        <span v-if="start != null || end != null">
          | {{ start != null ? era(start) : $t('exhibition.timeline.earliest') }}
          {{ $t('exhibition.timeline.to') }}
          {{ end != null ? era(end) : $t('exhibition.timeline.latest') }}
        </span>
      </p>
      <p>{{ page.total }} {{ $t('exhibition.results.objects') }}</p>
      <p class="back-to-events">
        <RouterLink :to="{ name: 'timeline-results', query: { c: route.query.country ?? 'all', start: route.query.start ?? '', end: route.query.end ?? '' } }">
          ➤ {{ $t('exhibition.timeline.backToEvents') }}
        </RouterLink>
      </p>
    </div>

    <PageLinks :page-info="page" @navigate="navigate" />

    <div id="content-container">
      <ObjectGrid v-if="page.rows.length" :results="page.rows" />
      <p v-else class="no-results">{{ $t('exhibition.results.noObjectsInPeriod') }}</p>
    </div>

    <PageLinks :page-info="page" @navigate="navigate" />
  </div>
</template>

<style scoped>
#timeline-gallery-container { background: #fff; width: 100%; min-height: 400px; padding-bottom: 30px; }
#gallery-header { padding: 0 20px 12px; }
#gallery-header span { font-weight: 700; }
.back-to-events a { color: var(--link-blue); font-size: 13px; }
#content-container { padding: 0 20px; }
.no-results { padding: 30px 0; }
</style>
