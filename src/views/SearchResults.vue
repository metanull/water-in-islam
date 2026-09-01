<script setup>
import { computed, watch, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { items, loadEnglish } from '../composables/useExhibitionData.js'
import { textSearch, paginate, resetSearchIndex } from '../composables/useCollection.js'
import ObjectGrid from '../components/ObjectGrid.vue'
import PageLinks from '../components/PageLinks.vue'
import BackLink from '../components/BackLink.vue'

// The header search bar's results. Legacy ran MySQL boolean full-text search
// server-side; here the same operator grammar runs over a client-side index
// (see useCollection.js `textSearch`), which is the only shape a static site
// can take. `all-objects` is legacy's sentinel for an empty submission.
const route = useRoute()
const router = useRouter()

const ready = ref(false)
loadEnglish().then(() => { resetSearchIndex(); ready.value = true })

const term = computed(() => String(route.query.q ?? ''))
const results = computed(() => {
  if (!ready.value) return []
  if (!term.value || term.value === 'all-objects') return items.value
  return textSearch(term.value)
})
const page = computed(() => paginate(results.value, route.query.page ?? 1))

function navigate(p) {
  router.push({ name: 'search-results', query: { ...route.query, page: p } })
}
watch(term, () => { if (route.query.page) navigate(1) })
</script>

<template>
  <div id="search-results-container">
    <BackLink />

    <div id="info-container">
      <p>
        Database |
        <span>{{ term && term !== 'all-objects' ? `“${term}”` : 'All objects' }}</span>
      </p>
      <p>{{ page.total }} {{ $t('exhibition.results.outOf') }} {{ items.length }} {{ $t('exhibition.results.objects') }}</p>
      <p class="how-to"><RouterLink to="/how-to-search">{{ $t('exhibition.search.howToLink') }} ›</RouterLink></p>
    </div>

    <PageLinks :page-info="page" @navigate="navigate" />

    <div id="content-container">
      <ObjectGrid v-if="page.rows.length" :results="page.rows" />
      <!-- Was one sentence with two links threaded through it. The message
           stands on its own and the two ways out are links beside it. -->
      <p v-else class="no-results">
        {{ $t('exhibition.results.noSearchResults') }}
        <RouterLink to="/how-to-search">{{ $t('exhibition.search.howToLink') }}</RouterLink>
        <span class="no-results-divider">|</span>
        <RouterLink to="/collection">{{ $t('exhibition.section.collection') }}</RouterLink>
      </p>
    </div>

    <PageLinks :page-info="page" @navigate="navigate" />
  </div>
</template>

<style scoped>
#search-results-container { background: #fff; width: 100%; min-height: 400px; }
#info-container { padding: 0 20px 12px; font-size: 15px; }
#info-container span { font-weight: 700; }
.how-to a { color: var(--link-blue); font-size: 13px; }
#content-container { padding: 0 20px 20px; }
.no-results { padding: 40px 0; }
.no-results a { color: var(--link-blue); }
</style>
