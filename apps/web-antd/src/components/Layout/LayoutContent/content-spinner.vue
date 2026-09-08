<script lang="ts" setup>
import { Spinner } from '#/components/Spinner';

import { useContentSpinner } from './use-content-spinner';

defineOptions({ name: 'LayoutContentSpinner' });

const { spinning } = useContentSpinner();
</script>
<template>
  <Spinner :spinning="spinning" />
</template>
