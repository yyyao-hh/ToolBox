<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { computed, useSlots } from 'vue';

import { useRefresh } from '#/hooks';
import { Menu, RotateCw } from '#/components/Icon';
import {
  preferences,
  preferencesManager,
  usePreferences,
} from '#/preferences';
import { useAccessStore } from '#/store';

import { VbenFullScreen } from '#/components/FullScreen';
import { IconButton } from '#/components/Button';

import { LanguageToggle } from '#/components/LanguageToggle';
import { ThemeToggle } from '#/components/ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { PreferencesButton } from '#/components/Preferences';

defineOptions({
  name: 'LayoutHeader',
});

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

const REFERENCE_VALUE = 50;

const accessStore = useAccessStore();
const {
  globalSearchShortcutKey,
  isDark,
  isMobile,
  layout,
  preferencesButtonPosition,
} = usePreferences();
const slots = useSlots();
const { refresh } = useRefresh();

// 以下布局判断与 AdminLayout 的 useLayout 保持一致：
// 始终基于“移动端固定为 sidebar-nav”的当前布局，避免使用 usePreferences
// 中基于原始偏好的 isFullContent/isMixedNav/isSideMode（移动端会存在差异）。
/**
 * 全屏模式（不需要侧边、底部、顶部、tab 区域）
 */
const isFullContent = computed(() => layout.value === 'full-content');

/**
 * 混合导航模式（mixed-nav 或 header-sidebar-nav）
 */
const isMixedNav = computed(
  () => layout.value === 'mixed-nav' || layout.value === 'header-sidebar-nav',
);

/**
 * 侧边混合导航模式
 */
const isSideMixedNav = computed(() => layout.value === 'sidebar-mixed-nav');

/**
 * 是否包含侧边导航（用于决定 header 是否通栏、是否展示 Logo 等）
 */
const isSideMode = computed(
  () =>
    layout.value === 'mixed-nav' ||
    layout.value === 'sidebar-mixed-nav' ||
    layout.value === 'sidebar-nav' ||
    layout.value === 'header-mixed-nav' ||
    layout.value === 'header-sidebar-nav',
);

/**
 * 头部主题，用于切换 header 的明暗配色
 */
const headerTheme = computed(() => {
  return isDark.value || preferences.theme.semiDarkHeader ? 'dark' : 'light';
});

/**
 * 是否通栏（非侧边布局时，header 撑满右侧）
 */
const fullWidth = computed(() => !isSideMode.value);

/**
 * 头部是否展示（全屏模式或偏好隐藏时不展示）
 */
const show = computed(
  () => !isFullContent.value && !preferences.header.hidden,
);

/**
 * 是否展示头部 Logo
 */
const showHeaderLogo = computed(
  () => !isSideMode.value || isMixedNav.value || isMobile.value,
);

/**
 * 是否展示侧边栏折叠按钮
 */
const showHeaderToggleButton = computed(
  () =>
    isMobile.value ||
    (preferences.widget.sidebarToggle &&
      isSideMode.value &&
      !isSideMixedNav.value &&
      !isMixedNav.value &&
      !isMobile.value),
);

function handleHeaderToggle() {
  // 移动端展开抽屉菜单
  if (isMobile.value) {
    preferencesManager.updatePreferences({ sidebar: { collapsed: false } });
  } else {
    // 桌面端切换侧边栏显隐
    preferencesManager.updatePreferences({
      sidebar: { hidden: !preferences.sidebar.hidden },
    });
  }
}

const style = computed((): CSSProperties => {
  const right = !show.value || !fullWidth.value ? undefined : 0;
  const height = preferences.header.height;

  return {
    height: `${height}px`,
    marginTop: show.value ? 0 : `-${height}px`,
    right,
  };
});

const logoStyle = computed((): CSSProperties => {
  return {
    minWidth: `${isMobile.value ? 40 : preferences.sidebar.width}px`,
  };
});

const rightSlots = computed(() => {
  const list = [{ index: REFERENCE_VALUE + 100, name: 'user-dropdown' }];
  if (preferences.widget.globalSearch) {
    list.push({
      index: REFERENCE_VALUE,
      name: 'global-search',
    });
  }

  if (preferencesButtonPosition.value.header) {
    list.push({
      index: REFERENCE_VALUE + 10,
      name: 'preferences',
    });
  }
  if (preferences.widget.themeToggle) {
    list.push({
      index: REFERENCE_VALUE + 20,
      name: 'theme-toggle',
    });
  }
  if (preferences.widget.languageToggle) {
    list.push({
      index: REFERENCE_VALUE + 30,
      name: 'language-toggle',
    });
  }
  if (preferences.widget.fullscreen) {
    list.push({
      index: REFERENCE_VALUE + 40,
      name: 'fullscreen',
    });
  }
  if (preferences.widget.notification) {
    list.push({
      index: REFERENCE_VALUE + 50,
      name: 'notification',
    });
  }

  Object.keys(slots).forEach((key) => {
    const name = key.split('-');
    if (key.startsWith('header-right')) {
      list.push({ index: Number(name[2]), name: key });
    }
  });
  return list.sort((a, b) => a.index - b.index);
});

const leftSlots = computed(() => {
  const list: Array<{ index: number; name: string }> = [];

  if (preferences.widget.refresh) {
    list.push({
      index: 0,
      name: 'refresh',
    });
  }

  Object.keys(slots).forEach((key) => {
    const name = key.split('-');
    if (key.startsWith('header-left')) {
      list.push({ index: Number(name[2]), name: key });
    }
  });
  return list.sort((a, b) => a.index - b.index);
});

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}
</script>

<template>
  <header
    :class="headerTheme"
    :style="style"
    class="border-border bg-header top-0 flex w-full flex-[0_0_auto] items-center border-b pl-2 transition-[margin-top] duration-200"
  >
    <!-- Logo -->
    <div v-if="showHeaderLogo && slots.logo" :style="logoStyle">
      <slot name="logo"></slot>
    </div>

    <!-- 侧边栏折叠按钮 -->
    <IconButton
      v-if="showHeaderToggleButton"
      class="my-0 mr-1 rounded-md"
      @click="handleHeaderToggle"
    >
      <Menu class="size-4" />
    </IconButton>

    <!-- 左侧插槽（index < REFERENCE_VALUE） -->
    <template
      v-for="slot in leftSlots.filter((item) => item.index < REFERENCE_VALUE)"
      :key="slot.name"
    >
      <slot :name="slot.name">
        <template v-if="slot.name === 'refresh'">
          <IconButton class="my-0 mr-1 rounded-md" @click="refresh">
            <RotateCw class="size-4" />
          </IconButton>
        </template>
      </slot>
    </template>

    <!-- 面包屑 -->
    <div class="flex-center hidden lg:block">
      <slot name="breadcrumb"></slot>
    </div>

    <!-- 左侧追加插槽（index > REFERENCE_VALUE） -->
    <template
      v-for="slot in leftSlots.filter((item) => item.index > REFERENCE_VALUE)"
      :key="slot.name"
    >
      <slot :name="slot.name"></slot>
    </template>

    <!-- 菜单 -->
    <div
      :class="`menu-align-${preferences.header.menuAlign}`"
      class="flex h-full min-w-0 flex-1 items-center"
    >
      <slot name="menu"></slot>
    </div>

    <!-- 右侧插槽 -->
    <div class="flex h-full min-w-0 flex-shrink-0 items-center">
      <template v-for="slot in rightSlots" :key="slot.name">
        <slot :name="slot.name">
          <template v-if="slot.name === 'global-search'">
            <GlobalSearch
              :enable-shortcut-key="globalSearchShortcutKey"
              :menus="accessStore.accessMenus"
              class="mr-1 sm:mr-4"
            />
          </template>

          <template v-else-if="slot.name === 'preferences'">
            <PreferencesButton
              class="mr-1"
              @clear-preferences-and-logout="clearPreferencesAndLogout"
            />
          </template>
          <template v-else-if="slot.name === 'theme-toggle'">
            <ThemeToggle class="mr-1 mt-[2px]" />
          </template>
          <template v-else-if="slot.name === 'language-toggle'">
            <LanguageToggle class="mr-1" />
          </template>
          <template v-else-if="slot.name === 'fullscreen'">
            <VbenFullScreen class="mr-1" />
          </template>
        </slot>
      </template>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.menu-align-start {
  --menu-align: start;
}

.menu-align-center {
  --menu-align: center;
}

.menu-align-end {
  --menu-align: end;
}
</style>
