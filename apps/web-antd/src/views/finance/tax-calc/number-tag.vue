<script lang="ts" setup>
import { Icon } from '#/components/Icon';

import { formatMoney } from './tax-formula';

defineOptions({ name: 'TaxAmountTag' });

defineProps<{ value: number }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="border-border bg-accent text-foreground hover:border-primary/60 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors"
  >
    <span>{{ formatMoney(value) }}</span>
    <button
      class="text-muted-foreground inline-flex size-4 items-center justify-center rounded-full transition-colors hover:bg-rose-500/15 hover:text-rose-500"
      title="移除"
      type="button"
      @click="emit('close')"
    >
      <Icon class="size-3" icon="lucide:x" />
    </button>
  </div>
</template>
