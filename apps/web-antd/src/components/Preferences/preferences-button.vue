<script lang="ts" setup>
import { Settings } from '#/components/Icon';

import { IconButton } from '#/components/Button';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}
</script>
<template>
  <Preferences @clear-preferences-and-logout="clearPreferencesAndLogout">
    <IconButton>
      <Settings class="text-foreground size-4" />
    </IconButton>
  </Preferences>
</template>
