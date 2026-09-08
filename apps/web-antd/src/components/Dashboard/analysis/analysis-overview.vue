<script setup lang="ts">
import type { AnalysisOverviewItem } from '../typing';

import {
  CountToAnimator,
} from '#/components/CountToAnimator';
import { Icon } from '#/components/Icon';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ShadcnUi';

interface Props {
  items?: AnalysisOverviewItem[];
}

defineOptions({
  name: 'AnalysisOverview',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <template v-for="item in items" :key="item.title">
      <Card :title="item.title" class="w-full">
        <CardHeader>
          <CardTitle class="text-xl">{{ item.title }}</CardTitle>
        </CardHeader>

        <CardContent class="flex items-center justify-between">
          <CountToAnimator
            :end-val="item.value"
            :start-val="1"
            class="text-xl"
            prefix=""
          />
          <Icon :icon="item.icon" class="size-8 flex-shrink-0" />
        </CardContent>
        <CardFooter class="justify-between">
          <span>{{ item.totalTitle }}</span>
          <CountToAnimator
            :end-val="item.totalValue"
            :start-val="1"
            prefix=""
          />
        </CardFooter>
      </Card>
    </template>
  </div>
</template>
