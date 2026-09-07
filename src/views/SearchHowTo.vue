<script setup>
import { TextPageView } from '@metanull/viewer-layout/views'

// Editorial page, shared by every exhibition. The whole essay is about MySQL
// boolean full-text operators, which is why useCollection.js implements that
// grammar rather than a plain substring match. `back` points at the
// collection entrance, the only page that links here (its own `howTo`
// entry, over the same route name) — the view's `back` is a fixed
// destination, not `router.back()`, so there is no page-agnostic answer.
const searchHowToSpec = {
  body: 'catalogue.search.howToEssay',
  back: { label: 'core.action.back', to: { name: 'collection' } },
}
</script>

<template>
  <TextPageView :spec="searchHowToSpec" class="editorial" />
</template>

<style scoped>
.editorial :deep(.mwnf-text-page__back) { padding: 12px 0; }
</style>
