<script lang="ts" setup>
import type { Combo } from './find-closest';

import { computed } from 'vue';

import { formatNumber } from './find-closest';

defineOptions({ name: 'ComboCard' });

const props = defineProps<{
  combo: Combo;
  target: number;
}>();

const emit = defineEmits<{ click: [] }>();

// 组合的表达式，如 "12 + 8 + 15"
const expression = computed(() =>
  props.combo.nums.map((n) => formatNumber(n)).join(' + '),
);

// 与目标的差值文案（不超过模式：target - sum）
const diffText = computed(() => {
  const { sum } = props.combo;
  return sum === props.target
    ? '✓ 精确'
    : `Δ ${formatNumber(props.target - sum)}`;
});
</script>

<template>
  <div
    class="border-border bg-card hover:border-primary flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5 transition hover:shadow-md"
    @click="emit('click')"
  >
    <span class="text-foreground break-all text-sm font-semibold tracking-wide">
      {{ expression || '（空集）' }}
    </span>
    <span
      class="text-muted-foreground flex flex-nowrap items-center gap-2 text-sm"
    >
      =
      <strong class="text-primary text-base">{{
        formatNumber(combo.sum)
      }}</strong>
      <span class="text-xs">{{ diffText }}</span>
    </span>
  </div>
</template>
