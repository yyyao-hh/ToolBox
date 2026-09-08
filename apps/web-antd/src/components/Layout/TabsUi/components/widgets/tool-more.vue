<script lang="ts" setup>
import type { DropdownMenuProps } from '#/components/DropdownMenu';

import { ChevronDown } from '#/components/Icon';
import { DropdownMenu } from '#/components/DropdownMenu';

defineProps<DropdownMenuProps>();
</script>

<template>
  <DropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center hover:bg-muted hover:text-foreground text-muted-foreground border-border h-full cursor-pointer border-l px-2 text-lg font-semibold"
    >
      <ChevronDown class="size-4" />
    </div>
  </DropdownMenu>
</template>
