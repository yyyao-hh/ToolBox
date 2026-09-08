<script setup lang="ts">
import type { CustomRenderType } from '../types';

import { HelpTooltip } from '#/components/Tooltip';
import { RenderContent } from '#/components/RenderContent';
import {
  FormLabel
} from '#/components/ShadcnUi';
import { cn } from '#/shared/utils';

interface Props {
  class?: string;
  colon?: boolean;
  help?: CustomRenderType;
  label?: CustomRenderType;
  required?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <FormLabel :class="cn('flex items-center', props.class)">
    <span v-if="required" class="text-destructive mr-[2px]">*</span>
    <slot></slot>
    <HelpTooltip v-if="help" trigger-class="size-3.5 ml-1">
      <RenderContent :content="help" />
    </HelpTooltip>
    <span v-if="colon && label" class="ml-[2px]">:</span>
  </FormLabel>
</template>
