<script setup>
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { I18nText, useFacets, useI18n, yearBuckets } from '@metanull/viewer-core'
import { FacetSelect } from '@metanull/viewer-layout/content'
import { items } from '../composables/useExhibitionData.js'
import { FACETS, FACET_CATEGORIES, useFacetLabels } from '../composables/useCollection.js'

// The collection entrance, in legacy's shape (decision D2): one dropdown per
// facet, over the *whole* member universe, and choosing one goes to the
// results page. Narrowing only starts there.
const router = useRouter()
const { t } = useI18n()
const labels = useFacetLabels()

const options = useFacets(items, FACETS)
const years = computed(() => yearBuckets(items.value ?? [], t))

const selection = ref({ country: '', type: '', dynasty: '', subject: '', material: '', artist: '', start: '', end: '' })

function goToResults(key, value) {
  if (value === '') return
  router.push({ name: 'collection-results', query: { [key]: String(value) } })
}

const visibleFacets = computed(() => FACET_CATEGORIES.filter((c) => (options.value[c] ?? []).length > 0))
</script>

<template>
  <div id="collection-search-container">
    <div id="dropdowns">
      <div id="dropdown-label">{{ $t('catalogue.facet.filterBy') }}</div>
      <div id="select-container">
        <FacetSelect
          v-model="selection.country"
          :options="options.country"
          :placeholder="$t('catalogue.facet.selectCountry')"
          @update:model-value="goToResults('country', $event)"
        />
        <FacetSelect
          v-for="category in visibleFacets"
          :key="category"
          v-model="selection[category]"
          :options="options[category]"
          :placeholder="labels[category]"
          @update:model-value="goToResults(category, $event)"
        />
        <div id="dates-container">
          <FacetSelect v-model="selection.start" :options="years" :placeholder="$t('catalogue.facet.startDate')" @update:model-value="goToResults('start', $event)" />
          <FacetSelect v-model="selection.end" :options="years" :placeholder="$t('catalogue.facet.endDate')" @update:model-value="goToResults('end', $event)" />
        </div>
      </div>
    </div>

    <!-- A shared entry, not this exhibition's own: the only thing that made the
         old `txtCollection` exhibition-specific was an absolute URL to its own
         Themes page, which is `#/themes` now. -->
    <I18nText id="description" class="prose" dir="auto" keypath="exhibition.collection.intro" />
    <p id="how-to-search-link">
      <RouterLink :to="{ name: 'search-how-to' }">{{ $t('exhibition.search.howToLink') }}</RouterLink>
    </p>
  </div>
</template>

<style scoped>
#collection-search-container {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  width: 100%;
}
#dropdowns { display: flex; flex-direction: column; width: 40%; padding: 50px; }
#dropdown-label { max-width: 300px; padding-bottom: 6px; font-size: 125%; font-weight: 700; }
#select-container { width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 10px; }
#dates-container { display: flex; gap: 10px; max-width: 300px; }
#dates-container > * { flex: 1; min-width: 0; }
#description { width: 60%; padding: 50px 75px 20px 0; margin-top: 45px; }
#description a { color: var(--link-blue); }
#how-to-search-link { width: 60%; margin-inline-start: 40%; padding: 0 75px 40px 0; }
#how-to-search-link a { color: var(--link-blue); }

@media only screen and (max-width: 849px) {
  #collection-search-container { flex-direction: column; }
  #dropdowns, #description { width: 100%; padding: 30px; margin-top: 0; }
  #how-to-search-link { width: 100%; margin-inline-start: 0; padding: 0 30px 30px; }
}
</style>
