<script setup>
// The Water in Islam page chrome, built on `PageShell` from
// @metanull/viewer-layout.
//
// PageShell contributes the page skeleton (skip link, the seven ordered
// sections, the `#mwnf-content` landmark); everything inside them is this
// website's own, supplied through PageShell's slots. The exhibition's chrome
// carries a search field, sponsor-logo groups and a dismissible notice that no
// combination of PageShell props can express, which is why the slots are used
// rather than the props.
//
// The section mapping is a close fit for what the exhibition already stacks:
//
//   header      → MWNF mark, header logos, the platform label, search
//   banner      → the tall home banner, or the narrow per-section sub-banner
//   navigation  → the exhibition menu
//   content     → the active view
//   hyperlinks  → the bottom banner (the two ways into the exhibition)
//   sponsors    → the sponsor-logo strip
//   footer      → the MWNF footer links
import { computed, ref, watch } from 'vue'
import { PageShell } from '@metanull/viewer-layout'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { exhibition } from './composables/useExhibitionData.js'
import { hasTimeline } from './composables/useTimeline.js'
import { useI18n } from '@metanull/viewer-core'
import HomeBanner from './components/HomeBanner.vue'
import SubBanner from './components/SubBanner.vue'
import BottomBanner from './components/BottomBanner.vue'
import LogoStrip from './components/LogoStrip.vue'
import PopupLogo from './components/PopupLogo.vue'

const { t, locale } = useI18n()

// `language` and `update:language` are the shell contract of viewer-core: the
// value it passes down is the language the application is in, and the event it
// listens for sets it. There used to be a second language here — `uiLang`, kept
// in step with this one by hand, because the chrome came from a vendored
// catalogue rather than from `locales/`. Both now come from the same place, so
// there is one language and nothing to keep in step.
//
// `languages` is declared only so it stops here: viewer-core passes the
// resolved language list to every shell, and forwarding it to PageShell would
// grow a language switcher in the navigation bar. This exhibition publishes
// one enabled language, and per the epic's decision Q2 an exhibition ships one
// build per enabled language rather than switching between them at runtime.
defineProps({
  language: { type: String, default: 'en' },
  languages: { type: Array, default: () => [] },
})
defineOptions({ inheritAttrs: false })

const route = useRoute()
const router = useRouter()

const PORTAL = 'https://www.museumwnf.org'

const isHome = computed(() => route.name === 'home')
const currentYear = new Date().getFullYear()

const searchInput = ref('')
// `all-objects` is legacy's sentinel for an empty submission, and the value
// SearchResults matches on. The two must agree: the monorepo viewer sent
// `all-items` from here while matching `all-objects` there, so an empty search
// reported no results out of the full count instead of listing everything.
function submitSearch() {
  router.push({ name: 'search-results', query: { q: searchInput.value || 'all-objects' } })
  searchInput.value = ''
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
const navItems = computed(() => NAV.value.filter((i) => i.path !== 'timeline' || hasTimeline.value))

const menuOpen = ref(false)

// Legacy renders category 0 — "Header" — beside the MWNF mark, under the
// `header_logo_section_1` heading, and leaves categories 1–4 to the footer
// strip. This exhibition has one logo and it is category 1, the UNAOC mark
// under "Under the patronage of", so the header block stays empty here too;
// the code is kept because the split is the data's, not this exhibition's.
const headerLogos = computed(() =>
  (exhibition.logos ?? [])
    .filter((logo) => Number(logo.category_id) === 0 && logo.visible !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
)

function logoCaption(logo) {
  return logo.labels?.[locale.value] ?? logo.labels?.en ?? logo.alt_text ?? ''
}

// Scroll handling. `createViewerRouter` builds the router itself and takes no
// `scrollBehavior`, so the browser keeps the previous page's scroll offset when
// a route changes — following a result into an item sheet would land halfway
// down it. The rule here is the exhibition's usual one: honour an anchor,
// otherwise go back to the top, and stay put when only the parameters of the
// current page changed (picking another picture inside a theme must not scroll
// the page away).
watch(
  () => route.fullPath,
  (to, from) => {
    if (from && route.name && router.resolve(from).name === route.name) return
    if (route.hash) {
      document.querySelector(route.hash)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0 })
  },
)
</script>

<template>
  <PageShell v-bind="$attrs">
    <template #header>
      <PopupLogo />
      <div id="header-inner">
        <div id="logo-container">
          <a :href="`${PORTAL}/`" target="_blank" rel="noopener">
            <span class="logo-mark">MWNF</span>
          </a>
          <div class="header-logos-container" v-if="headerLogos.length">
            <div class="header-logos-header">{{ t('exhibition.sponsors.coOrganisers') }}</div>
            <div class="header-logos">
              <a
                v-for="logo in headerLogos"
                :key="logo.id ?? logo.image_url"
                class="header-logo"
                :href="logo.url || undefined"
                :title="logoCaption(logo)"
                target="_blank"
                rel="noopener"
              ><img :src="logo.image_url" :alt="logoCaption(logo)" /></a>
            </div>
          </div>
        </div>

        <!-- Legacy's centre cell is the platform label, linking to the About
             page. The exhibition's own title lives in the banner and the bottom
             banner, not here. -->
        <div id="title-container">
          <RouterLink to="/about">
            <span id="title">{{ t('exhibition.identity.tagline') }}</span>
          </RouterLink>
        </div>

        <div id="portals-search-container">
          <div id="portal-links">
            <RouterLink to="/">{{ $t('core.nav.home') }}</RouterLink>
            <span> | </span>
            <a :href="`${PORTAL}/about`" target="_blank" rel="noopener">{{ $t('exhibition.footer.aboutMwnf') }}</a>
          </div>
          <div id="search-container">
            <form @submit.prevent="submitSearch">
              <input id="search-input" type="search" v-model="searchInput" :placeholder="$t('exhibition.search.placeholder')" />
              <button id="search-submit" type="submit" :aria-label="$t('exhibition.search.submit')">⌕</button>
            </form>
          </div>
          <!-- No language switcher: `languages_enabled` holds English alone, and
               per decision Q2 an exhibition ships one build per enabled language.
               The switcher appears the day a second language is enabled. -->
        </div>
      </div>
    </template>

    <!-- Legacy stacks the named views in this order: banner (home only),
         navigation, sub-banner (everywhere else). One PageShell section serves
         both banners. -->
    <template #banner>
      <HomeBanner v-if="isHome" />
      <SubBanner v-else />
    </template>

    <template #navigation>
      <div id="navigation-inner">
        <button id="hamburger" @click="menuOpen = !menuOpen" :aria-label="$t('exhibition.nav.menu')">☰</button>
        <ul :class="{ open: menuOpen }">
          <li v-for="item in navItems" :key="item.path" :class="`menu-${item.path}`">
            <RouterLink :to="`/${item.path}`" @click="menuOpen = false">{{ item.label }}</RouterLink>
          </li>
          <li class="menu-my-collection">
            <a :href="`${PORTAL}/mycollection/index.php`" target="_blank" rel="noopener">{{ $t('exhibition.nav.myCollection') }}</a>
          </li>
        </ul>
      </div>
    </template>

    <slot />

    <template #hyperlinks>
      <BottomBanner />
    </template>

    <template #sponsors>
      <LogoStrip />
    </template>

    <template #footer>
      <div id="footer-links">
        <a :href="`${PORTAL}/about`" target="_blank" rel="noopener">{{ $t('exhibition.footer.aboutMwnf') }}</a> |
        <a :href="`${PORTAL}/about/contact`" target="_blank" rel="noopener">{{ $t('exhibition.footer.contact') }}</a> |
        <a :href="`${PORTAL}/about/legal-notice`" target="_blank" rel="noopener">{{ $t('exhibition.footer.legalNotice') }}</a> |
        <a :href="`${PORTAL}/about/credits`" target="_blank" rel="noopener">{{ $t('exhibition.footer.credits') }}</a> |
        <a :href="`${PORTAL}/about/cookies`" target="_blank" rel="noopener">{{ $t('exhibition.footer.cookies') }}</a> |
        <span>{{ $t('exhibition.footer.copyright') }} 2004–{{ currentYear }}</span>
      </div>
    </template>
  </PageShell>
</template>

<style scoped>
/* ── Header ─────────────────────────────────────────────────────────────── */
/* Legacy's header is white with a 5px contrast rule under it — not the solid
   dark bar the galleries use. The rule itself is on `.mwnf-header`, in
   theme/overrides.css. */
#header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 80px;
}
#logo-container { display: flex; align-items: center; gap: 16px; padding: 0 14px; z-index: 8; }
#logo-container a { text-decoration: none; }
.header-logos-container { font-size: 12px; text-align: center; }
.header-logos-header { font-weight: 700; }
.header-logos { display: flex; align-items: center; gap: 10px; }
.header-logo img { max-height: 46px; max-width: 120px; object-fit: contain; }
.logo-mark {
  display: inline-block;
  border: 2px solid var(--secondary-text-color);
  padding: 4px 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-size: 18px;
}
#title-container {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 6px 8px;
  z-index: 10;
}
#title-container a { color: inherit; text-decoration: none; }
#title {
  font-size: clamp(15px, 1.6vw, 22px);
  line-height: 1.1;
  overflow-wrap: break-word;
}

#portals-search-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 12px;
  font-size: 14px;
  z-index: 10;
}
#portal-links a { text-decoration: none; padding: 0 8px; }
#portal-links a:hover { text-decoration: underline; }
#search-container { padding-top: 8px; }
#search-input {
  border: 2px solid var(--main-color);
  border-radius: 4px;
  padding: 4px 6px;
  margin-right: 5px;
  font-family: inherit;
}
#search-submit {
  border: 2px solid var(--contrast-color);
  background: var(--contrast-color);
  border-radius: 4px;
  color: var(--contrast-text-color);
  padding: 4px 10px;
  cursor: pointer;
  font-size: 15px;
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
#navigation-inner { width: 100%; }
/* One equal column per entry, however many there are. A fixed `repeat(8, 1fr)`
   is right only for an exhibition that shows TIMELINE; this one does not, and
   the eighth column would sit empty at the end of the bar. Legacy sizes the
   items with flex-grow, which is the same behaviour. */
#navigation-inner ul {
  list-style: none;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  width: 100%;
  margin: 0;
  padding: 0;
}
#navigation-inner li {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--contrast-color);
  border: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 28px;
}
#navigation-inner a {
  width: 100%;
  text-align: center;
  color: var(--contrast-text-color);
  font-weight: 700;
  text-decoration: none;
  padding: 2px 4px;
  font-size: 96%;
  /* Legacy upper-cased the menu in JavaScript. Doing it in CSS instead keeps
     each entry stored in its natural case, which is the only form a translator
     can work with — and the only form that means anything in Arabic. */
  text-transform: uppercase;
}
#navigation-inner a.router-link-active { background: rgba(0, 0, 0, 0.14); }
#hamburger { display: none; }

/* ── Footer ─────────────────────────────────────────────────────────────── */
#footer-links { width: 100%; text-align: center; }
#footer-links a { color: var(--main-text-color); text-decoration: none; }
#footer-links a:hover { text-decoration: underline; }

@media only screen and (max-width: 1199px) {
  #navigation-inner ul { grid-auto-flow: row; grid-template-columns: repeat(4, 1fr); }
}

@media only screen and (max-width: 599px) {
  #header-inner { min-height: 65px; flex-wrap: wrap; }
  #title-container { flex-basis: 100%; order: 3; }
  #navigation-inner ul { display: none; }
  #navigation-inner ul.open { display: flex; flex-direction: column; }
  #hamburger {
    display: block;
    background: var(--main-color);
    color: var(--main-text-color);
    border: none;
    width: 100%;
    padding: 6px;
    font-size: 20px;
    cursor: pointer;
  }
}
</style>
