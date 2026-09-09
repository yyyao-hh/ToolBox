<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { computed } from 'vue';

defineOptions({
  name: 'LayoutFooter',
});

interface Props {
  /**
   * 是否固定在底部
   */
  fixed?: boolean;
  height: number;
  /**
   * 是否显示
   * @default true
   */
  show?: boolean;
  width: string;
  zIndex: number;
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
});

const style = computed((): CSSProperties => {
  const { fixed, height, show, width, zIndex } = props;
  return {
    height: `${height}px`,
    marginBottom: show ? '0' : `-${height}px`,
    position: fixed ? 'fixed' : 'static',
    transform: show ? 'translateY(0)' : 'translateY(100%)',
    width,
    zIndex,
  };
});
</script>

<template>
  <footer
    :style="style"
    class="bg-background-deep bottom-0 w-full shrink-0 transition-all duration-200"
  >
    <div class="flex-center text-muted-foreground relative h-full w-full text-xs">
      <slot></slot>
    </div>
  </footer>
</template>
