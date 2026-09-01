<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="editorial">
    <h1 class="page-heading">{{ $t('exhibition.error.notFoundTitle') }}</h1>
    <div class="prose">
      <p>{{ $t('exhibition.error.notFoundBody') }}</p>
      <p>
        Try the <RouterLink to="/collection">{{ $t('exhibition.section.collection') }}</RouterLink>,
        the <RouterLink to="/partners">{{ $t('exhibition.nav.partners') }}</RouterLink>,
        or go back <RouterLink to="/">{{ $t('core.nav.home') }}</RouterLink>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.editorial { background: #fff; width: 100%; min-height: 400px; }
.prose { padding: 10px 40px 40px; }
.prose a { color: var(--link-blue); }
</style>
