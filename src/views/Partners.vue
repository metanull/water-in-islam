<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  visiblePartners, partnerRoute, partnerObjectsRoute, partnerLabel, countryLabel,
  tr, defaultLang,
} from '../composables/useExhibitionData.js'
import { I18nText } from '@metanull/viewer-core'
import BackLink from '../components/BackLink.vue'

// The partners list, grouped by country with an A–Z / Z–A toggle, exactly as
// legacy's PartnersPage.vue.
//
// ── One list, two legacy endpoints ─────────────────────────────────────────
// Legacy splits monument-owning institutions (`/institutions`) from museums
// (`/partners`) because it has one page template and one query each. A data
// package has no endpoints, so `partners.json` ships the union and carries a
// `type`; this page lists both and the profile link routes on that type. The
// count therefore matches neither legacy endpoint alone and matches their
// union exactly — the exporter README makes the same point from the other
// side.
//
// ── Hidden partners are excluded, items are not ────────────────────────────
// `exhibition.json.hidden_partner_ids` is legacy's E6 rule: the museum is
// hidden from every list and profile page while its items keep rendering — it
// hides the museum, not the object, so this must not be pushed down into the
// item queries. It is also why this page's count cannot be compared against
// `partners.json` directly: the union of legacy's two endpoints equals the
// package's rows MINUS the hidden ones, and a raw comparison reads as an
// overcount.
//
// ── Partners that hold nothing are listed, because legacy lists them ────────
// Legacy's partner query is a three-branch UNION whose third branch — its own
// comment calls it MWNF-384 — selects every museum *created under the site's
// own project*, whether or not it holds a member item. Such a partner gets a
// full entry here — name, city, logo, "Read more" — and only the "View
// objects" link is withheld, which is exactly what legacy does with
// `v-if="partner.hasObjects"`.
//
// The one place this differs from legacy is the object-count line, which is
// this viewer's addition (legacy prints no count on the partners page). Left
// alone it would read "0 objects in this Exhibition", which looks like a data
// fault rather than a fact about the partner, so a zero-count partner gets a
// line naming the reason it is listed instead.
//
// Legacy also printed a "Partner / Affiliate" badge from `isPartner`, a flag
// that describes a partner's relationship to a *project* rather than to this
// exhibition, and `partners.project_id` in the inventory model is the museum's
// creating project rather than that relationship. The badge is therefore
// omitted, as on the amulets and carpets forks.
const order = ref('a-z')

// `txtPartners` linked back into the exhibition by absolute legacy URL; the
// importer rewrites those into hash routes on the way in, so the package's own
// links work and nothing here rewrites a text.

const grouped = computed(() => {
  const byCountry = new Map()
  for (const partner of visiblePartners.value) {
    const country = countryLabel(partner.country_id)
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(partner)
  }
  const rows = [...byCountry.entries()]
    .map(([country, list]) => [
      country,
      list.sort((a, b) => partnerLabel(a.id).localeCompare(partnerLabel(b.id))),
    ])
    .sort((a, b) => a[0].localeCompare(b[0]))
  return order.value === 'a-z' ? rows : rows.reverse()
})

function city(partner) {
  return tr('partners', partner.id, defaultLang).city ?? ''
}
</script>

<template>
  <div id="partners-container">
    <div id="partners-options-container">
      <BackLink />
      <div id="partners-order">
        <!-- Both sentences whole, rather than one with the order appended: a
             translator has to be able to move every word of a text, including
             the part that used to be a value. -->
        <button class="legacy-button" @click="order = order === 'a-z' ? 'z-a' : 'a-z'">
          {{ order === 'a-z' ? $t('exhibition.partner.sortDescending') : $t('exhibition.partner.sortAscending') }}
        </button>
      </div>
    </div>

    <!-- A shared entry, not this exhibition's own: the only thing that made the
         old `txtPartners` exhibition-specific was an absolute URL to its own
         Themes page, which is `#/themes` now. -->
    <I18nText id="partners-list-description" class="prose" dir="auto" keypath="exhibition.partners.intro" />

    <div id="partners-list-wrapper">
      <section class="partners-list" v-for="[country, list] in grouped" :key="country">
        <h2 class="partners-country">{{ country }}</h2>
        <div class="partner" v-for="partner in list" :key="partner.id">
          <div class="partner-text-links-container">
            <div class="partner-name">
              <RouterLink :to="partnerRoute(partner)">
                {{ partnerLabel(partner.id) }}<span v-if="city(partner)">, {{ city(partner) }}</span>
              </RouterLink>
            </div>
            <div class="partner-meta" v-if="partner.item_count">
              {{ partner.item_count }} {{ $t('exhibition.partner.objectsInExhibition') }}
            </div>
            <div class="partner-meta partner-meta-empty" v-else>
              {{ $t('exhibition.partner.noObjectsInExhibition') }}
            </div>
            <div class="partner-links">
              <RouterLink :to="partnerRoute(partner)">{{ $t('exhibition.action.readMore') }}</RouterLink>
              <template v-if="partner.item_count">
                <span class="partner-link-divider">|</span>
                <RouterLink :to="partnerObjectsRoute(partner)">{{ $t('exhibition.action.viewObjects') }}</RouterLink>
              </template>
            </div>
          </div>
          <div class="partner-logo" v-if="partner.logos?.length">
            <img :src="partner.logos[0].url" :alt="partnerLabel(partner.id)" loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
#partners-container { background: #fff; width: 100%; min-height: 400px; padding-bottom: 30px; }
#partners-options-container { display: flex; align-items: center; justify-content: space-between; padding-inline-end: 20px; }
#partners-list-description { padding: 6px 40px 20px; max-width: 900px; line-height: 1.5; }
#partners-list-wrapper { padding: 0 40px; }
.partners-country {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-dark);
  border-bottom: 2px solid var(--theme-medium);
  margin-top: 22px;
  padding-bottom: 3px;
}
.partner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--background-color);
}
.partner-text-links-container { flex: 1; min-width: 0; }
.partner-name a { font-weight: 700; color: var(--link-blue); text-decoration: none; }
.partner-name a:hover { text-decoration: underline; }
.partner-meta { font-size: 13px; color: #666; margin: 3px 0; }
.partner-meta-empty { font-style: italic; }
.partner-links a { color: var(--link-blue); font-size: 13px; text-decoration: none; }
.partner-links a:hover { text-decoration: underline; }
.partner-link-divider { margin: 0 6px; color: #999; }
.partner-logo img { max-width: 120px; max-height: 70px; object-fit: contain; display: block; }
</style>
