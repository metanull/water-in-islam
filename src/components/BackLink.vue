<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="back-bar">
    <button @click="router.back()">↩ {{ $t('exhibition.action.back') }}</button>
  </div>
</template>
