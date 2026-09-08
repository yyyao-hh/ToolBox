<script setup lang="ts">
import type { AuthPageLayoutType } from '#/types';

import type { DropdownMenuItem } from '#/components/DropdownMenu';

import { computed } from 'vue';

import { InspectionPanel, PanelLeft, PanelRight } from '#/components/Icon';
import { $t } from '#/locales';
import {
  preferences,
  preferencesManager,
  usePreferences,
} from '#/preferences';

import { IconButton } from '#/components/Button';
import { DropdownRadioMenu } from '#/components/DropdownMenu';

defineOptions({
  name: 'AuthenticationLayoutToggle',
});

const menus = computed((): DropdownMenuItem[] => [
  {
    icon: PanelLeft,
    label: $t('authentication.layout.alignLeft'),
    value: 'panel-left',
  },
  {
    icon: InspectionPanel,
    label: $t('authentication.layout.center'),
    value: 'panel-center',
  },
  {
    icon: PanelRight,
    label: $t('authentication.layout.alignRight'),
    value: 'panel-right',
  },
]);

const { authPanelCenter, authPanelLeft, authPanelRight } = usePreferences();

function handleUpdate(value: string | undefined) {
  if (!value) return;
  preferencesManager.updatePreferences({
    app: {
      authPageLayout: value as AuthPageLayoutType,
    },
  });
}
</script>

<template>
  <DropdownRadioMenu
    :menus="menus"
    :model-value="preferences.app.authPageLayout"
    @update:model-value="handleUpdate"
  >
    <IconButton>
      <PanelRight v-if="authPanelRight" class="size-4" />
      <PanelLeft v-if="authPanelLeft" class="size-4" />
      <InspectionPanel v-if="authPanelCenter" class="size-4" />
    </IconButton>
  </DropdownRadioMenu>
</template>
