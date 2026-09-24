<template>
  <span v-for="(corner, i) in corners" :key="corner" class="screw" :class="`screw--${corner}`" :style="{ '--a': `${angles[i]}deg`, '--s': `${size}px`, '--inset': `${inset}px` }" aria-hidden="true" />
</template>

<script>
// Each panel gets screws turned differently, like a real assembly
let counter = 0;
</script>

<script setup>
defineProps({
  size: { type: Number, default: 9 },
  inset: { type: Number, default: 7 },
  corners: { type: Array, default: () => ['tl', 'tr', 'bl', 'br'] }
});

const angles = Array.from({ length: 4 }, () => (counter++ * 137.5) % 180);
</script>

<style scoped>
.screw--tl {
  top: var(--inset);
  left: var(--inset);
}
.screw--tr {
  top: var(--inset);
  right: var(--inset);
}
.screw--bl {
  bottom: var(--inset);
  left: var(--inset);
}
.screw--br {
  bottom: var(--inset);
  right: var(--inset);
}
</style>
