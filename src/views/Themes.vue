<script setup>
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { SectionCards } from '@metanull/viewer-layout/content'
import { listedThemes, romanFor, themeText } from '../composables/themes.js'
import { themeNodeRoute } from '../composables/themeSpecs.js'

const { t, locale } = useI18n()

// Legacy's ThemesPage — an accordion of the exhibition's own themes, one card
// a theme, each numbered in Roman and opening onto its sub-themes — now
// viewer-layout's SectionCards `accordion` variant. That variant renders only
// a number, a title and a list of child links: no image, no description and
// no per-card action beyond the children (see the package's README.md), so
// the cover crop, the 250-character presentation excerpt and the direct
// "see gallery for Theme N" link legacy showed here are dropped rather than
// approximated. 'Overview' is added as the children's own first entry — the
// card itself carries no link of its own in this variant — so every theme
// stays reachable from this page whether or not it has sub-themes.
//
// It starts at display order 2 — `listedThemes` skips the About theme, which
// legacy renders at /about instead.
const cards = computed(() =>
  listedThemes.value.map((theme) => ({
    title: themeText(theme, locale.value).title ?? theme.internal_name ?? '',
    number: romanFor(theme.display_order),
    children: [
      { title: t('exhibition.theme.overview'), to: themeNodeRoute(theme) },
      ...(theme.sub_themes ?? []).map((sub) => ({
        title: themeText(sub, locale.value).title ?? sub.internal_name ?? '',
        to: themeNodeRoute(sub),
      })),
    ],
  })),
)
</script>

<template>
  <div id="themes-wrapper">
    <div id="themes-container">
      <SectionCards :cards="cards" variant="accordion" />
    </div>
  </div>
</template>

<style scoped>
/* Legacy paints the left half of this page in the main colour and lays the
   content over it — the panel that makes the theme cards read as inset. */
#themes-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: var(--secondary-color);
}
#themes-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 50%;
  background: var(--main-color);
}
#themes-container {
  position: relative;
  z-index: 1;
  width: 95%;
  padding: 30px 50px 50px;
}

@media only screen and (max-width: 1199px) {
  #themes-container { width: 100%; padding: 30px; }
}

@media only screen and (max-width: 649px) {
  #themes-wrapper::before { background: transparent; }
}
</style>
