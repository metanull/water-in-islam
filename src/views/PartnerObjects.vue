<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { sortChronological, useListQuery, usePagination } from '@metanull/viewer-core'
import { Pagination, RecordGrid } from '@metanull/viewer-layout/content'
import {
  items, visiblePartnerById, partnerRoute, partnerLabel, countryLabel, tr, defaultLang,
} from '../composables/useExhibitionData.js'
import { PAGE_SIZE, useGridRecords } from '../composables/useCollection.js'
import BackLink from '../components/BackLink.vue'

// The member items one partner holds. Legacy paginated this at the API's page
// size; the same nine-a-page grid is used here as for collection results.
//
// Legacy split this into PartnerObjects and InstitutionMonuments, one per
// endpoint. Here it is one component and `variant` supplies the count line;
// the pager stays on whichever route the page was reached by.
const props = defineProps({
  variant: { type: String, default: 'partner' },
})

const isInstitutionView = computed(() => props.variant === 'institution')

const route = useRoute()
const gridRecords = useGridRecords()
const { page, goToPage } = useListQuery()

const partner = computed(() => visiblePartnerById(route.params.id))
const held = computed(() => {
  const p = partner.value
  if (!p) return []
  return sortChronological((items.value ?? []).filter((i) => i.partner_id === p.id), { undated: 'first' })
})
const pageInfo = usePagination(held, { page, size: PAGE_SIZE })
const rows = computed(() => gridRecords(pageInfo.value.rows))

const city = computed(() => (partner.value ? tr('partners', partner.value.id, defaultLang).city ?? '' : ''))
</script>

<template>
  <div id="partner-objects-container" v-if="partner">
    <BackLink />

    <div id="partner-objects-header">
      <p id="partner-name">{{ partnerLabel(partner.id) }}</p>
      <p id="partner-location">{{ [city, countryLabel(partner.country_id)].filter(Boolean).join(', ') }}</p>
      <p id="partner-count">
        {{ pageInfo.total }} {{ isInstitutionView ? 'monument(s) in this Exhibition' : $t('exhibition.partner.objectsInExhibition') }}
      </p>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />

    <div id="content-container">
      <RecordGrid :records="rows" :action-label="$t('exhibition.action.seeDatabaseEntry')">
        <template #empty>
          <p class="no-results">
            This {{ isInstitutionView ? 'institution' : 'partner' }} holds nothing in this Exhibition.
          </p>
        </template>
      </RecordGrid>
      <div id="profile-link-container">
        <RouterLink id="profile-link" :to="partnerRoute(partner)">
          ➤ {{ isInstitutionView ? 'Institution' : 'Partner' }} Profile
        </RouterLink>
      </div>
    </div>

    <Pagination class="pages" :page-info="pageInfo" jump @navigate="goToPage" />
  </div>
</template>

<style scoped>
#partner-objects-container { background: #fff; width: 100%; min-height: 400px; padding-bottom: 30px; }
#partner-objects-header { padding: 0 20px 12px; }
#partner-name { font-size: 22px; font-weight: 700; color: var(--theme-dark); }
#partner-location { color: #555; }
#partner-count { font-size: 13px; color: #666; margin-top: 3px; }
.pages { padding-inline: 20px; }
#content-container { padding: 0 20px; }
#profile-link-container { padding-top: 16px; }
#profile-link { color: var(--link-blue); }
.no-results { padding: 30px 0; }
</style>
