<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { timelineCountries, eventYearBuckets, usesLocalTimeline } from '../composables/useTimeline.js'
import { I18nText, useI18n } from '@metanull/viewer-core'

// Timeline entry form.
//
// Unlike a gallery, an exhibition can have a chronology of its own. This one
// does not, so this form drives the worldwide country merge and the country
// select renders. Which of the two is in play is `usesLocalTimeline`, never a
// literal here — and note it turns on the presence of a `thg_local` row, not
// on `has_country_timeline`.
//
// Both chronology flags being false also means the nav offers no Timeline and
// nothing on the site links here (see `hasTimeline`), yet the page stays
// reachable by URL because legacy keeps it reachable — typing /timeline on the
// live instance still renders this form and its introduction. So this
// component must render sensibly for a visitor who arrives with no link.
//
// The introduction is a shared entry: the only thing that made the old
// `txtTimeline` this exhibition's own was an absolute URL to its Themes page —
// and that URL pointed at a staging host. It is `#/themes` now.
const router = useRouter()
const { t } = useI18n()
const yearBuckets = computed(() => eventYearBuckets(t))

const country = ref('')
const start = ref('')
const end = ref('')

function goToResults() {
  router.push({
    name: 'timeline-results',
    query: { c: country.value || 'all', start: start.value, end: end.value },
  })
}
</script>

<template>
  <div id="timeline-page">
    <div id="timeline-form">
      <select class="legacy-select" v-model="country" v-if="!usesLocalTimeline">
        <option value="" disabled>{{ $t('exhibition.timeline.selectCountry') }}</option>
        <option v-for="c in timelineCountries" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
      </select>

      <div id="timeline-dates-container">
        <select class="legacy-select" v-model="start">
          <option value="" disabled>{{ $t('exhibition.facet.startDate') }}</option>
          <option v-for="d in yearBuckets" :key="`s${d[0]}`" :value="d[0]">{{ d[1] }}</option>
        </select>
        <select class="legacy-select" v-model="end">
          <option value="" disabled>{{ $t('exhibition.facet.endDate') }}</option>
          <option v-for="d in yearBuckets" :key="`e${d[0]}`" :value="d[0]">{{ d[1] }}</option>
        </select>
      </div>

      <div id="timeline-go">
        <button class="legacy-button" @click="goToResults()">{{ $t('exhibition.action.go') }}</button>
      </div>
    </div>

    <I18nText id="timeline-description" class="prose" dir="auto" keypath="exhibition.timeline.intro" />
  </div>
</template>

<style scoped>
#timeline-page { display: flex; background: #fff; width: 100%; min-height: 400px; }
#timeline-form { display: flex; flex-direction: column; width: 40%; padding: 50px; max-width: 350px; }
#timeline-dates-container { display: flex; gap: 10px; }
#timeline-go { margin-top: 16px; }
#timeline-description { width: 60%; padding: 50px 75px 50px 0; line-height: 1.55; }
#timeline-description a { color: var(--link-blue); }

@media only screen and (max-width: 849px) {
  #timeline-page { flex-direction: column; }
  #timeline-form, #timeline-description { width: 100%; max-width: none; padding: 30px; }
}
</style>
