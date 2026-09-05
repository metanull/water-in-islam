<script setup>
// The Water in Islam page chrome: `PageShell` from @metanull/viewer-layout,
// filled from props. The only things this component adds are the values that
// depend on the route or the language — which banner shows, what the section
// is called, which logos go where — the MWNF mark in the header, and the
// dismissible popup notice, which is this exhibition's own.
import { computed } from 'vue'
import { useI18n, useSiteConfig } from '@metanull/viewer-core'
import { PageShell } from '@metanull/viewer-layout'
import { useRoute, useRouter } from 'vue-router'
import {
  exhibition, chromeImage, itemById, itemLabel, partnerLabel, countryLabel, tr, defaultLang,
  exhibitionTitle, exhibitionSubtitle, exhibitionHeadline, bannerCaption,
} from './composables/useExhibitionData.js'
import { hasTimeline } from './composables/useTimeline.js'
import PopupLogo from './components/PopupLogo.vue'

// `language`, `languages` and `update:language` are the shell contract of
// viewer-core: the language the application is in, the languages it offers
// (labelled, from dataset.config.js) and the event that sets it.
const props = defineProps({
  language: { type: String, default: 'en' },
  languages: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:language'])

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { links } = useSiteConfig()

const isHome = computed(() => route.name === 'home')
const currentYear = new Date().getFullYear()

// `all-objects` is legacy's sentinel for an empty submission, and the value
// SearchResults matches on. The two must agree: the monorepo viewer sent
// `all-items` from here while matching `all-objects` there, so an empty search
// reported no results out of the full count instead of listing everything.
function submitSearch(term) {
  router.push({ name: 'search-results', query: { q: term || 'all-objects' } })
}

// Legacy's NavigationComponent, one for one, with the single rename
// "related content" → /related. TIMELINE is dropped when the exhibition reports
// neither chronology — both flags gate the nav entry, not the data.
//
// The labels used to be the paths uppercased. They are entries now, each
// written out so the check that every entry exists can read it, in their
// natural case: the bar is upper-cased in CSS, which is the only form that
// means anything in a language without capitals.
const NAV = computed(() => [
  { path: 'about', label: t('exhibition.nav.about') },
  { path: 'themes', label: t('exhibition.nav.themes') },
  { path: 'collection', label: t('exhibition.nav.collection') },
  { path: 'partners', label: t('exhibition.nav.partners') },
  { path: 'timeline', label: t('exhibition.nav.timeline') },
  { path: 'related', label: t('exhibition.related.title') },
  { path: 'credits', label: t('exhibition.nav.credits') },
])
const navLinks = computed(() =>
  NAV.value
    .filter((i) => i.path !== 'timeline' || hasTimeline.value)
    .map((item) => ({
      label: item.label,
      href: `#/${item.path}`,
      active:
        route.path === `/${item.path}` ||
        route.path.startsWith(`/${item.path}/`) ||
        route.path.startsWith(`/${item.path}-`),
    }))
    .concat([{ label: t('exhibition.nav.myCollection'), href: links.myCollection, external: true }]),
)

const headerLinks = computed(() => [
  { label: t('core.nav.home'), href: '#/' },
  { label: t('exhibition.footer.aboutMwnf'), href: links.about, external: true },
])

const footerLinks = computed(() => [
  { label: t('exhibition.footer.aboutMwnf'), href: links.about, external: true },
  { label: t('exhibition.footer.contact'), href: links.contact, external: true },
  { label: t('exhibition.footer.legalNotice'), href: links.legalNotice, external: true },
  { label: t('exhibition.footer.credits'), href: links.credits, external: true },
  { label: t('exhibition.footer.cookies'), href: links.cookies, external: true },
])

function logoCaption(logo) {
  return logo.labels?.[locale.value] ?? logo.labels?.en ?? logo.alt_text ?? ''
}

// Legacy renders category 0 — "Header" — beside the MWNF mark, under the
// `header_logo_section_1` heading, and leaves categories 1–4 to the footer
// strip. This exhibition has one logo and it is category 1, the UNAOC mark
// under "Under the patronage of", so the header block stays empty here too;
// the code is kept because the split is the data's, not this exhibition's.
const headerLogos = computed(() =>
  (exhibition.value?.logos ?? [])
    .filter((logo) => Number(logo.category_id) === 0 && logo.visible !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((logo) => ({ image: logo.image_url, alt: logoCaption(logo), href: logo.url || undefined })),
)

// Each heading is written out: a name assembled from the category id would
// resolve at run time and be invisible to the check that every entry a page
// asks for exists. Only the two categories that carry real copy are entries —
// legacy's slots 3 and 4 hold placeholder text ("MIDDLE RIGHT FOOTER SECTION
// FOR LOGOS"), which is not something to ask a translator for. Those fall back
// to the legacy category name, exactly as an unlisted category always did.
function headingFor(categoryId, logo) {
  if (Number(categoryId) === 1) return t('exhibition.sponsors.patronage')
  if (Number(categoryId) === 2) return t('exhibition.sponsors.support')
  return logo.category ?? ''
}

// The sponsor strip: legacy's LogosComponent, as sponsor groups. Its rules are
// legacy's — category 0 is the header block above, a logo with
// `visible: false` is dropped, and a category with nothing visible left in it
// renders no heading either, which the layout does by dropping an empty group.
const sponsorGroups = computed(() => {
  const byCategory = new Map()
  for (const logo of exhibition.value?.logos ?? []) {
    if (logo.visible === false) continue
    if (Number(logo.category_id) === 0) continue
    const key = logo.category_id ?? 0
    const bucket = byCategory.get(key)
    if (bucket) bucket.push(logo)
    else byCategory.set(key, [logo])
  }
  return [...byCategory.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([categoryId, logos]) => ({
      title: headingFor(categoryId, logos[0]),
      sponsors: [...logos]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((logo) => ({ name: logoCaption(logo), href: logo.url || undefined, logo: logo.image_url })),
    }))
})

// The banner: the exhibition's own image, captioned with the curator's own
// line where there is one and with the banner item's sheet where there is not.
const bannerImage = computed(() => chromeImage(exhibition.value?.banner_image_path, 'hi_res'))
const banner = computed(() => {
  const curated = bannerCaption(locale.value)
  if (curated) return curated
  const item = itemById.value.get(exhibition.value?.banner_item_id)
  if (!item) return ''
  const sheet = tr('items', item.id, defaultLang)
  return {
    name: itemLabel(item),
    partner: partnerLabel(item.partner_id),
    location: sheet.location ?? '',
    country: countryLabel(item.country_id),
  }
})

// The section title over the narrow banner, derived from the route: data the
// site owns, rendered by the layout.
const sectionTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/theme')) return t('exhibition.section.themes')
  if (path.startsWith('/collection')) return t('exhibition.section.collection')
  if (path.startsWith('/item') || path.startsWith('/search')) return t('exhibition.section.database')
  if (path.startsWith('/how-to-search')) return t('exhibition.section.database')
  if (path.startsWith('/partner') || path.startsWith('/institution')) return t('exhibition.section.partners')
  if (path.startsWith('/related')) return t('exhibition.related.title')
  if (path.startsWith('/timeline')) return t('exhibition.section.timeline')
  if (path.startsWith('/about')) return t('exhibition.section.about')
  if (path.startsWith('/credits')) return t('exhibition.section.credits')
  return t('exhibition.section.error')
})

// Legacy's BottomBanner: the exhibition's identity on the left, and the two
// ways into it on the right. It sits under every page, including Home.
const bottomLinks = computed(() => [
  { label: t('exhibition.nav.about'), description: t('exhibition.nav.introduction'), href: '#/about' },
  { label: t('exhibition.nav.themes'), description: t('exhibition.nav.contentAtAGlance'), href: '#/themes' },
])
</script>

<template>
  <PageShell
    :languages="props.languages"
    :language="props.language"
    language-placement="header"
    language-style="buttons"
    :header-home="links.portal"
    :header-logos="headerLogos"
    :header-logos-title="headerLogos.length ? t('exhibition.sponsors.coOrganisers') : ''"
    :header-title="t('exhibition.identity.tagline')"
    header-title-href="#/about"
    :header-links="headerLinks"
    :search="{ placeholder: t('exhibition.search.placeholder'), submitLabel: t('exhibition.search.submit') }"
    :banner-variant="isHome ? 'split' : 'section'"
    :banner-image="bannerImage"
    :banner-caption="banner"
    :banner-caption-label="t('exhibition.media.detailFrom')"
    :banner-title="isHome ? exhibitionTitle(locale) : sectionTitle"
    :banner-subtitle="isHome ? exhibitionSubtitle(locale) : ''"
    :banner-headline="isHome ? exhibitionHeadline(locale) : ''"
    :banner-enter="isHome ? { label: t('exhibition.action.enter'), href: '#/about' } : null"
    :banner-strapline="isHome ? t('exhibition.identity.strapline') : ''"
    :nav-links="navLinks"
    hyperlinks-variant="tiles"
    :hyperlinks-title="exhibitionTitle(locale)"
    hyperlinks-title-href="#/"
    :hyperlinks-subtitle="exhibitionSubtitle(locale)"
    :hyperlinks="bottomLinks"
    :sponsor-groups="sponsorGroups"
    :footer-links="footerLinks"
    :footer-text="`${t('exhibition.footer.copyright')} 2004–${currentYear}`"
    @search="submitSearch"
    @update:language="emit('update:language', $event)"
  >
    <template #header-brand><span class="logo-mark">MWNF</span></template>
    <PopupLogo />
    <slot />
  </PageShell>
</template>

<style scoped>
.logo-mark {
  display: inline-block;
  border: 2px solid currentColor;
  padding: 4px 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-size: 18px;
}
</style>
