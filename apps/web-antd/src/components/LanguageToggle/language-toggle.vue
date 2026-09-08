<script setup lang="ts">
import type { SupportedLanguagesType } from '#/locales';

import { SUPPORT_LANGUAGES } from '#/constants';
import { Languages } from '#/components/Icon';
import { loadLocaleMessages } from '#/locales';
import { preferences, preferencesManager } from '#/preferences';

import { IconButton } from '#/components/Button';
import { DropdownRadioMenu } from '#/components/DropdownMenu';

defineOptions({
  name: 'LanguageToggle',
});

async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  preferencesManager.updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
}
</script>

<template>
  <div>
    <DropdownRadioMenu
      :menus="SUPPORT_LANGUAGES"
      :model-value="preferences.app.locale"
      @update:model-value="handleUpdate"
    >
      <IconButton>
        <Languages class="text-foreground size-4" />
      </IconButton>
    </DropdownRadioMenu>
  </div>
</template>
