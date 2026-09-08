<script lang="ts" setup>
import type { BreadcrumbStyleType } from '#/types';

import type { IBreadcrumb } from './types';

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '#/locales';

import { useForwardPropsEmits } from 'radix-vue';

import BreadcrumbBackground from './breadcrumb-background.vue';
import BreadcrumbNormal from './breadcrumb-normal.vue';

interface Props{
  hideWhenOnlyOne?: boolean;
  showHome?: boolean;
  showIcon?: boolean;
  type?: BreadcrumbStyleType;
}

const props = withDefaults(defineProps<Props>(), {
  showHome: false,
  showIcon: false,
  type: 'normal',
});

const route = useRoute();
const router = useRouter();

const breadcrumbs = computed((): IBreadcrumb[] => {
  const matched = route.matched;

  const resultBreadcrumb: IBreadcrumb[] = [];

  for (const match of matched) {
    const { meta, path } = match;
    const { hideChildrenInMenu, hideInBreadcrumb, icon, name, title } =
      meta || {};
    if (hideInBreadcrumb || hideChildrenInMenu || !path) {
      continue;
    }

    resultBreadcrumb.push({
      icon,
      path: path || route.path,
      title: title ? $t((title || name) as string) : '',
    });
  }
  if (props.showHome) {
    resultBreadcrumb.unshift({
      icon: 'mdi:home-outline',
      isHome: true,
      path: '/',
    });
  }
  if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
    return [];
  }

  return resultBreadcrumb;
});

const emit = defineEmits<{ select: [string] }>();
const forward = useForwardPropsEmits(props, emit);

function handleSelect(path: string) {
  router.push(path);
}
</script>
<template>
  <BreadcrumbNormal
    v-if="type === 'normal'"
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    @select="handleSelect"
    class="vben-breadcrumb ml-2"
  />
  <BreadcrumbBackground
    v-if="type === 'background'"
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    @select="handleSelect"
    class="vben-breadcrumb ml-2"
  />
</template>
<style lang="scss" scoped>
/** 修复全局引入Antd时，ol和ul的默认样式会被修改的问题 */
.vben-breadcrumb {
  :deep(ol),
  :deep(ul) {
    margin-bottom: 0;
  }
}
</style>
