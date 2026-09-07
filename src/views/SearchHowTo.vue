<script setup>
import { TextPageView } from '@metanull/viewer-layout/views'

// Editorial page, shared by every exhibition. The whole essay is about MySQL
// boolean full-text operators, which is why useCollection.js implements that
// grammar rather than a plain substring match. `back` points at the
// collection entrance, the only page that links here (its own `howTo`
// entry, over the same route name) — the view's `back` is a fixed
// destination, not `router.back()`, so there is no page-agnostic answer.
//
// `body` is a function, not the entry name string: viewer-layout 2.9.0's
// TextPageView passes a string `body` to `I18nText` under the wrong prop
// name (`entry-name` instead of `keypath`), which renders nothing. Reading
// the entry through `ctx.t` and handing back Markdown text takes the
// view's other body path instead, which does not go through that prop.
const searchHowToSpec = {
  body: (ctx) => ctx.t('catalogue.search.howToEssay'),
  back: { label: 'core.action.back', to: { name: 'collection' } },
}
</script>

<template>
  <TextPageView :spec="searchHowToSpec" class="editorial" />
</template>

<style scoped>
.editorial :deep(.mwnf-text-page__back) { padding: 12px 0; }
</style>
