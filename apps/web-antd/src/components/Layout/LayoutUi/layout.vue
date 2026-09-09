<script setup lang="ts">
import type { CSSProperties } from 'vue';

import type { LayoutProps } from './layout';

import { computed, ref, watch } from 'vue';

import {
  SCROLL_FIXED_CLASS,
  useLayoutFooterStyle,
  useLayoutHeaderStyle,
} from '#/hooks';

import { ELEMENT_ID_LAYOUT_SCROLL } from '#/shared/constants';
import { useEventListener, useScroll } from '@vueuse/core';

import LayoutSidebar from './layout-sidebar';
import { resolveHeaderHiddenOnScroll } from './header-scroll-state';
import { useLayout } from './use-layout';

interface Props extends LayoutProps {}

defineOptions({
  name: 'LayoutUi',
});

const props = withDefaults(defineProps<Props>(), {
  contentCompact: 'wide',
  contentCompactWidth: 1200,
  contentPadding: 0,
  contentPaddingBottom: 0,
  contentPaddingLeft: 0,
  contentPaddingRight: 0,
  contentPaddingTop: 0,
  footerEnable: false,
  footerFixed: true,
  footerHeight: 32,
  headerHeight: 50,
  headerHidden: false,
  headerMode: 'fixed',
  headerToggleSidebarButton: true,
  headerVisible: true,
  isMobile: false,
  layout: 'sidebar-nav',
  sidebarCollapsedButton: true,
  sidebarCollapseShowTitle: false,
  sidebarExtraCollapsedWidth: 60,
  sidebarFixedButton: true,
  sidebarHidden: false,
  sidebarMixedWidth: 80,
  sidebarTheme: 'dark',
  sidebarWidth: 180,
  sideCollapseWidth: 60,
  tabbarEnable: true,
  tabbarHeight: 40,
  zIndex: 200,
});

const emit = defineEmits<{ sideMouseLeave: [] }>();
const sidebarCollapse = defineModel<boolean>('sidebarCollapse', {
  default: false,
});
const sidebarExtraVisible = defineModel<boolean>('sidebarExtraVisible');
const sidebarExtraCollapse = defineModel<boolean>('sidebarExtraCollapse', {
  default: false,
});
const sidebarExpandOnHover = defineModel<boolean>('sidebarExpandOnHover', {
  default: false,
});
const sidebarEnable = defineModel<boolean>('sidebarEnable', { default: true });

const HEADER_TRIGGER_DISTANCE = 12;

// side是否处于hover状态展开菜单中
const sidebarExpandOnHovering = ref(false);
const headerIsHidden = ref(false);
const mainRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
let lastMouseY: null | number = null;

const {
  arrivedState,
  directions,
  y: scrollY,
} = useScroll(contentRef, {
  onScroll: handleLayoutScroll,
});

const { setLayoutHeaderHeight } = useLayoutHeaderStyle();
const { setLayoutFooterHeight } = useLayoutFooterStyle();

const {
  currentLayout,
  isFullContent,
  isHeaderMixedNav,
  isHeaderNav,
  isMixedNav,
  isSidebarMixedNav,
} = useLayout(props);

/**
 * 顶栏是否自动隐藏
 */
const isHeaderAutoActive = computed(
  () =>
    props.headerMode === 'auto' && !isMixedNav.value && !isFullContent.value,
);

const isHeaderOverlayModeActive = computed(
  () =>
    (props.headerMode === 'auto' || props.headerMode === 'auto-scroll') &&
    !isMixedNav.value &&
    !isFullContent.value,
);

const headerHasShadow = computed(() => scrollY.value > 20);

const headerWrapperHeight = computed(() => {
  let height = 0;
  if (props.headerVisible && !props.headerHidden) {
    height += props.headerHeight;
  }
  if (props.tabbarEnable) {
    height += props.tabbarHeight;
  }
  return height;
});

const getSideCollapseWidth = computed(() => {
  const { sidebarCollapseShowTitle, sidebarMixedWidth, sideCollapseWidth } =
    props;

  return sidebarCollapseShowTitle ||
    isSidebarMixedNav.value ||
    isHeaderMixedNav.value
    ? sidebarMixedWidth
    : sideCollapseWidth;
});

/**
 * 动态获取侧边区域是否可见
 */
const sidebarEnableState = computed(() => {
  return !isHeaderNav.value && sidebarEnable.value;
});

/**
 * 侧边区域离顶部高度
 */
const sidebarMarginTop = computed(() => {
  const { headerHeight, isMobile } = props;
  return isMixedNav.value && !isMobile ? headerHeight : 0;
});

/**
 * 动态获取侧边宽度
 */
const getSidebarWidth = computed(() => {
  const { isMobile, sidebarHidden, sidebarMixedWidth, sidebarWidth } = props;
  let width = 0;

  if (sidebarHidden) {
    return width;
  }

  if (
    !sidebarEnableState.value ||
    (sidebarHidden &&
      !isSidebarMixedNav.value &&
      !isMixedNav.value &&
      !isHeaderMixedNav.value)
  ) {
    return width;
  }

  if ((isHeaderMixedNav.value || isSidebarMixedNav.value) && !isMobile) {
    width = sidebarMixedWidth;
  } else if (sidebarCollapse.value) {
    width = isMobile ? 0 : getSideCollapseWidth.value;
  } else {
    width = sidebarWidth;
  }
  return width;
});

/**
 * 获取扩展区域宽度
 */
const sidebarExtraWidth = computed(() => {
  const { sidebarExtraCollapsedWidth, sidebarWidth } = props;

  return sidebarExtraCollapse.value ? sidebarExtraCollapsedWidth : sidebarWidth;
});

/**
 * 是否侧边栏模式，包含混合侧边
 */
const isSideMode = computed(
  () =>
    currentLayout.value === 'mixed-nav' ||
    currentLayout.value === 'sidebar-mixed-nav' ||
    currentLayout.value === 'sidebar-nav' ||
    currentLayout.value === 'header-mixed-nav' ||
    currentLayout.value === 'header-sidebar-nav',
);

/**
 * header fixed值
 */
const headerFixed = computed(() => {
  const { headerMode } = props;
  return (
    isMixedNav.value ||
    headerMode === 'fixed' ||
    headerMode === 'auto-scroll' ||
    headerMode === 'auto'
  );
});

const showSidebar = computed(() => {
  return isSideMode.value && sidebarEnable.value && !props.sidebarHidden;
});

/**
 * 遮罩可见性
 */
const maskVisible = computed(() => !sidebarCollapse.value && props.isMobile);

const mainStyle = computed(() => {
  let width = '100%';
  let sidebarAndExtraWidth = 'unset';
  if (
    headerFixed.value &&
    currentLayout.value !== 'header-nav' &&
    currentLayout.value !== 'mixed-nav' &&
    currentLayout.value !== 'header-sidebar-nav' &&
    showSidebar.value &&
    !props.isMobile
  ) {
    // fixed模式下生效
    const isSideNavEffective =
      (isSidebarMixedNav.value || isHeaderMixedNav.value) &&
      sidebarExpandOnHover.value &&
      sidebarExtraVisible.value;

    if (isSideNavEffective) {
      const sideCollapseWidth = sidebarCollapse.value
        ? getSideCollapseWidth.value
        : props.sidebarMixedWidth;
      const sideWidth = sidebarExtraCollapse.value
        ? props.sidebarExtraCollapsedWidth
        : props.sidebarWidth;

      // 100% - 侧边菜单混合宽度 - 菜单宽度
      sidebarAndExtraWidth = `${sideCollapseWidth + sideWidth}px`;
      width = `calc(100% - ${sidebarAndExtraWidth})`;
    } else {
      sidebarAndExtraWidth =
        sidebarExpandOnHovering.value && !sidebarExpandOnHover.value
          ? `${getSideCollapseWidth.value}px`
          : `${getSidebarWidth.value}px`;
      width = `calc(100% - ${sidebarAndExtraWidth})`;
    }
  }
  return {
    sidebarAndExtraWidth,
    width,
  };
});

// 计算 tabbar 的样式
const tabbarStyle = computed((): CSSProperties => {
  let width = '';
  let marginLeft = 0;

  // 如果不是混合导航，tabbar 的宽度为 100%
  if (!isMixedNav.value || props.sidebarHidden) {
    width = '100%';
  } else if (sidebarEnable.value) {
    // 鼠标在侧边栏上时，且侧边栏展开时的宽度
    const onHoveringWidth = sidebarExpandOnHover.value
      ? props.sidebarWidth
      : getSideCollapseWidth.value;

    // 设置 marginLeft，根据侧边栏是否折叠来决定
    marginLeft = sidebarCollapse.value
      ? getSideCollapseWidth.value
      : onHoveringWidth;

    // 设置 tabbar 的宽度，计算方式为 100% 减去侧边栏的宽度
    width = `calc(100% - ${sidebarCollapse.value ? getSidebarWidth.value : onHoveringWidth}px)`;
  } else {
    // 默认情况下，tabbar 的宽度为 100%
    width = '100%';
  }

  return {
    marginLeft: `${marginLeft}px`,
    width,
  };
});

const layoutScrollStyle = computed((): CSSProperties => {
  const fixed = headerFixed.value;

  if (!fixed) {
    return {
      marginTop: 0,
      paddingTop: 0,
    };
  }

  if (isHeaderOverlayModeActive.value) {
    return {
      marginTop: 0,
      paddingTop: isFullContent.value ? 0 : `${headerWrapperHeight.value}px`,
    };
  }

  return {
    marginTop:
      fixed &&
      !isFullContent.value &&
      !headerIsHidden.value &&
      (!isHeaderAutoActive.value || scrollY.value < headerWrapperHeight.value)
        ? `${headerWrapperHeight.value}px`
        : 0,
    paddingTop: 0,
  };
});

const contentStyle = computed((): CSSProperties => {
  const { footerEnable, footerFixed, footerHeight } = props;
  return {
    paddingBottom: `${footerEnable && footerFixed ? footerHeight : 0}px`,
  };
});

const headerZIndex = computed(() => {
  const { zIndex } = props;
  const offset = isMixedNav.value ? 1 : 0;
  return zIndex + offset;
});

const headerWrapperStyle = computed((): CSSProperties => {
  const fixed = headerFixed.value;
  const hidden = headerIsHidden.value || isFullContent.value;

  return {
    height: isFullContent.value ? '0' : `${headerWrapperHeight.value}px`,
    left: isMixedNav.value ? 0 : mainStyle.value.sidebarAndExtraWidth,
    position: fixed ? 'fixed' : 'static',
    top: 0,
    transform: fixed
      ? `translate3d(0, ${hidden ? '-100%' : '0'}, 0)`
      : undefined,
    transitionDuration: fixed ? undefined : '0ms',
    width: mainStyle.value.width,
    willChange: fixed ? 'transform' : undefined,
    'z-index': headerZIndex.value,
  };
});

/**
 * 侧边栏z-index
 */
const sidebarZIndex = computed(() => {
  const { isMobile, zIndex } = props;
  let offset = isMobile || isSideMode.value ? 1 : -1;

  if (isMixedNav.value) {
    offset += 1;
  }

  return zIndex + offset;
});

const footerWidth = computed(() => {
  if (!props.footerFixed) {
    return '100%';
  }

  return mainStyle.value.width;
});

const maskStyle = computed((): CSSProperties => {
  return { zIndex: props.zIndex };
});

watch(
  () => props.isMobile,
  (val) => {
    if (val) {
      sidebarCollapse.value = true;
    }
  },
  {
    immediate: true,
  },
);

watch(
  [() => headerWrapperHeight.value, () => isFullContent.value],
  ([height]) => {
    setLayoutHeaderHeight(isFullContent.value ? 0 : height);
  },
  {
    immediate: true,
  },
);

watch(
  () => props.footerHeight,
  (height: number) => {
    setLayoutFooterHeight(height);
  },
  {
    immediate: true,
  },
);

watch(
  [() => props.headerMode, () => isMixedNav.value, () => isFullContent.value],
  () => {
    headerIsHidden.value = false;
  },
);

useEventListener(mainRef, 'mousemove', handleHeaderMouseMove, {
  passive: true,
});
useEventListener(mainRef, 'wheel', handleLayoutWheel, {
  passive: true,
});

function handleLayoutWheel(event: WheelEvent) {
  lastMouseY = event.clientY;
}

function handleHeaderMouseMove(event: MouseEvent) {
  lastMouseY = event.clientY;

  if (!isHeaderAutoActive.value) {
    return;
  }

  updateHeaderVisibilityFromMouse(lastMouseY);
}

function updateHeaderVisibilityFromMouse(mouseY: null | number) {
  if (arrivedState.top || scrollY.value < headerWrapperHeight.value) {
    headerIsHidden.value = false;
    return;
  }

  if (mouseY === null) {
    return;
  }

  const isInTriggerZone = mouseY <= HEADER_TRIGGER_DISTANCE;
  const isInHeaderZone =
    !headerIsHidden.value && mouseY <= headerWrapperHeight.value;

  headerIsHidden.value = !(isInTriggerZone || isInHeaderZone);
}

function handleLayoutScroll() {
  if (isHeaderAutoActive.value) {
    updateHeaderVisibilityFromMouse(lastMouseY);
    return;
  }

  if (
    props.headerMode !== 'auto-scroll' ||
    isMixedNav.value ||
    isFullContent.value
  ) {
    return;
  }
  resolveHeaderVisibilityOnScroll();
}

function resolveHeaderVisibilityOnScroll() {
  headerIsHidden.value = resolveHeaderHiddenOnScroll({
    arrivedTop: arrivedState.top,
    currentHidden: headerIsHidden.value,
    directionDown: directions.bottom,
    directionUp: directions.top,
    headerHeight: headerWrapperHeight.value,
    scrollTop: scrollY.value,
  });
}

function handleClickMask() {
  sidebarCollapse.value = true;
}

const idLayoutScroll = ELEMENT_ID_LAYOUT_SCROLL;
const idLayoutStaticHeader = `${ELEMENT_ID_LAYOUT_SCROLL}__static_header`;
const layoutStaticHeaderTarget = `#${idLayoutStaticHeader}`;
</script>

<template>
  <div class="relative flex h-full min-h-0 w-full overflow-hidden">
    <!-- Siderbar -->
    <LayoutSidebar
      v-if="sidebarEnableState"
      v-model:collapse="sidebarCollapse"
      v-model:expand-on-hover="sidebarExpandOnHover"
      v-model:expand-on-hovering="sidebarExpandOnHovering"
      v-model:extra-collapse="sidebarExtraCollapse"
      v-model:extra-visible="sidebarExtraVisible"
      :show-collapse-button="sidebarCollapsedButton"
      :show-fixed-button="sidebarFixedButton"
      :collapse-width="getSideCollapseWidth"
      :dom-visible="!isMobile"
      :extra-width="sidebarExtraWidth"
      :fixed-extra="sidebarExpandOnHover"
      :header-height="isMixedNav ? 0 : headerHeight"
      :is-sidebar-mixed="isSidebarMixedNav || isHeaderMixedNav"
      :margin-top="sidebarMarginTop"
      :mixed-width="sidebarMixedWidth"
      :show="showSidebar"
      :theme="sidebarTheme"
      :width="getSidebarWidth"
      :z-index="sidebarZIndex"
      @leave="() => emit('sideMouseLeave')"
    >
      <!-- Logo -->
      <template v-if="isSideMode && !isMixedNav" #logo>
        <slot name="logo"></slot>
      </template>
      <!--  -->
      <template v-if="isSidebarMixedNav || isHeaderMixedNav">
        <slot name="mixed-menu"></slot>
      </template>
      <template v-else>
        <slot name="menu"></slot>
      </template>
      <!--  -->
      <template #extra>
        <slot name="side-extra"></slot>
      </template>
      <template #extra-title>
        <slot name="side-extra-title"></slot>
      </template>
    </LayoutSidebar>
    <!-- Header & Tabbar & Content & Footer -->
    <div
      ref="mainRef"
      class="relative flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in"
    >
      <Teleport defer :disabled="headerFixed" :to="layoutStaticHeaderTarget">
        <!-- Header & Tabbar -->
        <div
          :class="[
            {
              'shadow-[0_16px_24px_hsl(var(--background))]': headerHasShadow,
            },
            SCROLL_FIXED_CLASS,
          ]"
          :style="headerWrapperStyle"
          class="shrink-0 overflow-hidden transition-[transform,left,width] duration-200"
        >
          <slot v-if="headerVisible" name="header"></slot>

          <slot
            v-if="tabbarEnable"
            name="tabbar"
            :height="tabbarHeight"
            :style="tabbarStyle"
          ></slot>
        </div>
      </Teleport>

      <div
        :id="idLayoutScroll"
        ref="contentRef"
        :style="layoutScrollStyle"
        class="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
      >
        <div :id="idLayoutStaticHeader" class="contents"></div>

        <!-- Content -->
        <slot name="content" :content-style="contentStyle"></slot>
        <!-- Footer -->
        <slot
          v-if="footerEnable"
          name="footer"
          :fixed="footerFixed"
          :height="footerHeight"
          :show="!isFullContent"
          :width="footerWidth"
          :z-index="zIndex"
        ></slot>
      </div>
    </div>
    <slot name="extra"></slot>
    <!-- 遮罩层 -->
    <div
      v-if="maskVisible"
      :style="maskStyle"
      class="bg-overlay fixed left-0 top-0 h-full w-full transition-[background-color] duration-200"
      @click="handleClickMask"
    ></div>
  </div>
</template>
