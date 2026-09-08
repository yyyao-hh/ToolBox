<script setup lang="ts">
import type { SelectOption } from '#/types';

import { useSlots } from 'vue';

import { CircleHelp } from '#/components/Icon';

import { Tooltip } from '#/components/Tooltip';
import { Input } from '#/components/ShadcnUi';

defineOptions({
  name: 'PreferenceSelectItem',
});

withDefaults(
  defineProps<{
    disabled?: boolean;
    items?: SelectOption[];
    placeholder?: string;
  }>(),
  {
    disabled: false,
    placeholder: '',
    items: () => [],
  },
);

const inputValue = defineModel<string>();

const slots = useSlots();
</script>

<template>
  <div
    :class="{
      'hover:bg-accent': !slots.tip,
      'pointer-events-none opacity-50': disabled,
    }"
    class="my-1 flex w-full items-center justify-between rounded-md px-2 py-1"
  >
    <span class="flex items-center text-sm">
      <slot></slot>

      <Tooltip v-if="slots.tip" side="bottom">
        <template #trigger>
          <CircleHelp class="ml-1 size-3 cursor-help" />
        </template>
        <slot name="tip"></slot>
      </Tooltip>
    </span>
    <Input v-model="inputValue" class="h-8 w-[165px]" />
  </div>
</template>
