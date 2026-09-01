<script setup>
import { I18nText } from '@metanull/viewer-core'
import BackLink from '../components/BackLink.vue'

// The credits name this exhibition's own curators, authors and photographers,
// so there is nothing generic to inherit and the entry is this website's own.
// Legacy rendered it and nothing else; the page title comes from the sub-banner.
//
// `dir="auto"` replaces the old `dirFor()`, which asked the catalogue whether
// the active language really had this text and pinned the block left-to-right
// when it was falling back to English. The runtime does not answer that
// question any more, and it never needed to be asked: the browser reads the
// direction off the text it was actually given.
</script>

<template>
  <div class="editorial">
    <BackLink />
    <I18nText class="prose" dir="auto" keypath="waterInIslam.credits.body" />
  </div>
</template>

<style scoped>
.editorial { background: var(--secondary-color); width: 100%; min-height: 400px; padding-bottom: 40px; }
.prose { padding: 10px 50px 20px; max-width: 900px; line-height: 1.55; }
</style>
