<script setup>
// Legacy's home route mounts four named views — banner, navigation, bottom
// banner and logos — and nothing in the default slot. All four live in
// src/SiteShell.vue now, so the page itself is empty by design rather than by
// omission.
//
// This is where an exhibition differs from a gallery: a gallery home page
// carries a featured-partners carousel and a sibling-galleries strip, and an
// exhibition home page is the banner alone.
//
// Not a `TextPageView`: that view always renders a body entry, and this page
// has neither a heading nor a body — removing the route in favour of
// viewer-core's own generic home view would print a bare site-name heading
// and an entity nav this exhibition's home has never had. A route still has
// to name a component here, or the router falls back to that generic view.
</script>

<template>
  <div class="home-spacer"></div>
</template>

<style scoped>
.home-spacer { width: 100%; }
</style>
