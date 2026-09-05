<script setup>
import { ref, computed } from 'vue'
import { exhibition, md } from '../composables/useExhibitionData.js'
import { useI18n } from '@metanull/viewer-core'

const { locale } = useI18n()

// Legacy showed `exhibitionPopupLogo` once per page load when
// `exhibitionShowPopupLogo` was set, as a dismissible overlay. Both are
// per-language in the package (`popup_logos` / `popup_logo_show`), because the
// German instance suppresses the notice the English one shows.
//
// The body is Markdown like every other field, rendered through the one
// pipeline: the importer converts the legacy HTML on the way in, so a tag
// arriving here means that conversion missed it and it shows as the characters
// it is, which is where it can be seen and fixed.
const content = computed(() =>
  md(exhibition.value?.popup_logos?.[locale.value] ?? exhibition.value?.popup_logos?.en ?? '')
)
const enabled = computed(() => {
  const show = exhibition.value?.popup_logo_show
  if (show === null || show === undefined) return false
  if (typeof show === 'boolean') return show
  return show[locale.value] ?? show.en ?? false
})

const dismissed = ref(false)
const visible = computed(() => enabled.value && !!content.value && !dismissed.value)
</script>

<template>
  <div id="exhibition-popup" v-if="visible">
    <button id="exhibition-popup-close" @click="dismissed = true" :aria-label="$t('exhibition.ui.close')">✕</button>
    <div id="exhibition-popup-content" v-html="content"></div>
  </div>
</template>

<style scoped>
#exhibition-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 200;
  width: min(640px, 92vw);
  max-height: 80vh;
  overflow-y: auto;
  padding: 40px 30px 30px;
  background: var(--secondary-color);
  color: var(--secondary-text-color);
  border: 5px solid var(--contrast-color);
  box-shadow: 0 4px 20px 4px var(--shadow-grey);
}
#exhibition-popup-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--secondary-text-color);
}
#exhibition-popup-content :deep(p) { margin-bottom: 8px; }
#exhibition-popup-content :deep(img) { max-width: 100%; height: auto; }
#exhibition-popup-content :deep(a) { color: var(--link-blue); }
</style>
