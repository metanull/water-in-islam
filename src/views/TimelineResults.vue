<script setup>
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { timelineSpec } from '../composables/useTimeline.js'
import BackLink from '../components/BackLink.vue'

// Timeline results, on the platform's composed timeline view: the "See
// Gallery" cross-link renders whenever the chosen country/period actually
// contains member items — `timelineSpec` (composables/useTimeline.js) is the
// one place that join lives, because an item's own shape is this
// exhibition's, not the package's.
</script>

<template>
  <TimelineResultsView :spec="timelineSpec">
    <template #before>
      <BackLink />
    </template>
  </TimelineResultsView>
</template>
