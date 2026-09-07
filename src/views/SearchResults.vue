<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n, useKeywordIndex, useListQuery, usePagination } from '@metanull/viewer-core'
import { BackLink, Pagination, RecordGrid, ResultsSummary } from '@metanull/viewer-layout/content'
import { items, loadEnglish } from '../composables/useExhibitionData.js'
import { PAGE_SIZE, haystack, useGridRecords } from '../composables/useCollection.js'

// The header search bar's results. Legacy ran MySQL boolean full-text search
// server-side; viewer-core runs the same operator grammar over a client-side
// index of this exhibition's haystack, which is the only shape a static site
// can take. `all-objects` is legacy's sentinel for an empty submission.
//
// The index reads every record of the entity; this build lists only the
// members it can render, so the hits are kept to that subset.
const { t } = useI18n()
const gridRecords = useGridRecords()

const { filters, page, goToPage } = useListQuery({ keys: ['q'] })
const index = useKeywordIndex('items', { grammar: 'boolean', haystack })

const ready = ref(false)
loadEnglish().then(() => { ready.value = true })

const term = computed(() => filters.q)
const isAll = computed(() => !term.value || term.value === 'all-objects')
const results = computed(() => {
  if (!ready.value) return []
  const listed = items.value ?? []
  if (isAll.value) return listed
  const ids = new Set(listed.map((i) => i.id))
  return index.search(term.value).filter((i) => ids.has(i.id))
})
const pageInfo = usePagination(results, { page, size: PAGE_SIZE })
const rows = computed(() => gridRecords(pageInfo.value.rows))

const summary = computed(() => [
  { label: t('exhibition.section.database'), value: isAll.value ? t('catalogue.results.allObjects') : `“${term.value}”` },
  { count: pageInfo.value.total, value: `${t('catalogue.results.outOf')} ${(items.value ?? []).length} ${t('catalogue.results.objects')}` },
])
</script>

<template>
  <div id="search-results-container">
    <BackLink />

    <div id="info-container">
      <ResultsSummary :parts="summary" />
      <p class="how-to"><RouterLink :to="{ name: 'search-how-to' }">{{ $t('catalogue.search.howTo') }} ›</RouterLink></p>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />

    <div id="content-container">
      <RecordGrid :records="rows" :action-label="$t('exhibition.action.seeDatabaseEntry')">
        <!-- Was one sentence with two links threaded through it. The message
             stands on its own and the two ways out are links beside it. -->
        <template #empty>
          <p class="no-results">
            {{ $t('exhibition.results.noSearchResults') }}
            <RouterLink :to="{ name: 'search-how-to' }">{{ $t('catalogue.search.howTo') }}</RouterLink>
            <span class="no-results-divider">|</span>
            <RouterLink :to="{ name: 'collection' }">{{ $t('exhibition.section.collection') }}</RouterLink>
          </p>
        </template>
      </RecordGrid>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />
  </div>
</template>

<style scoped>
#search-results-container { background: #fff; width: 100%; min-height: 400px; }
#info-container { padding: 0 20px 12px; font-size: 15px; }
.how-to a { color: var(--link-blue); font-size: 13px; }
.pages { padding-inline: 20px; }
#content-container { padding: 0 20px 20px; }
.no-results { padding: 40px 0; }
.no-results a { color: var(--link-blue); }
</style>
