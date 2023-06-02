<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>
    <div>Component from Vue!</div>
    <button @click="count++">
      count is: {{ count }}
    </button>
  </div>
</template>
