<script lang="ts" setup>
import type { CSSProperties } from 'vue';
import type { VNode } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';

import { computed } from 'vue';
import { RouterView } from 'vue-router';

import { useLayoutContentStyle } from '#/hooks';
import { preferences, usePreferences } from '#/preferences';
import { getTabKey, storeToRefs, useTabbarStore } from '#/store';
import { Slot } from '#/components/ShadcnComponents';
import { ELEMENT_ID_MAIN_CONTENT } from '#/shared/constants';

import { IFrameRouterView } from '../Iframe';
import LayoutContentSpinner from './content-spinner.vue';

defineOptions({ name: 'LayoutContent' });

interface Props {
  /**
   * AdminLayout 透传的内容区样式
   * 主要用于固定头部/页脚时的 marginTop、paddingBottom 定位（依赖滚动等运行时状态）
   */
  contentStyle?: CSSProperties;
}

defineProps<Props>();

const tabbarStore = useTabbarStore();
const { keepAlive } = usePreferences();
const { contentElement, overlayStyle } = useLayoutContentStyle();

const { getCachedTabs, getExcludeCachedTabs, renderRouteView } =
  storeToRefs(tabbarStore);

/**
 * 内容区自身的样式：定宽布局 + 各方向内边距 + flex:1
 */
const style = computed((): CSSProperties => {
  const {
    contentCompact,
    contentCompactWidth,
    contentPadding,
    contentPaddingBottom,
    contentPaddingLeft,
    contentPaddingRight,
    contentPaddingTop,
  } = preferences.app;

  const compactStyle: CSSProperties =
    contentCompact === 'compact'
      ? { margin: '0 auto', width: `${contentCompactWidth}px` }
      : {};
  return {
    ...compactStyle,
    flex: 1,
    padding: `${contentPadding}px`,
    paddingBottom: `${contentPaddingBottom}px`,
    paddingLeft: `${contentPaddingLeft}px`,
    paddingRight: `${contentPaddingRight}px`,
    paddingTop: `${contentPaddingTop}px`,
  };
});

/**
 * 是否使用动画
 */
const getEnabledTransition = computed(() => {
  const { transition } = preferences;
  const transitionName = transition.name;
  return transitionName && transition.enable;
});

// 页面切换动画
function getTransitionName(_route: RouteLocationNormalizedLoaded) {
  // 如果偏好设置未设置，则不使用动画
  const { tabbar, transition } = preferences;
  const transitionName = transition.name;
  if (!transitionName || !transition.enable) {
    return;
  }

  // 标签页未启用或者未开启缓存，则使用全局配置动画
  if (!tabbar.enable || !keepAlive) {
    return transitionName;
  }

  // 如果页面已经加载过，则不使用动画
  // if (route.meta.loaded) {
  //   return;
  // }
  // 已经打开且已经加载过的页面不使用动画
  // const inTabs = getCachedTabs.value.includes(route.name as string);

  // return inTabs && route.meta.loaded ? undefined : transitionName;
  return transitionName;
}

/**
 * 转换组件，自动添加 name
 * @param component
 */
function transformComponent(
  component: VNode,
  route: RouteLocationNormalizedLoadedGeneric,
) {
  // 组件视图未找到，如果有设置后备视图，则返回后备视图，如果没有，则抛出错误
  if (!component) {
    console.error(
      'Component view not found，please check the route configuration',
    );
    return undefined;
  }

  const routeName = route.name as string;
  // 如果组件没有 name，则直接返回
  if (!routeName) {
    return component;
  }
  const componentName = (component?.type as any)?.name;

  // 已经设置过 name，则直接返回
  if (componentName) {
    return component;
  }

  // componentName 与 routeName 一致，则直接返回
  if (componentName === routeName) {
    return component;
  }

  // 设置 name
  component.type ||= {};
  (component.type as any).name = routeName;

  return component;
}
</script>

<template>
  <main
    :id="ELEMENT_ID_MAIN_CONTENT"
    ref="contentElement"
    :style="[style, contentStyle]"
    class="bg-background-deep relative transition-[margin-top] duration-200"
  >
    <Slot :style="overlayStyle">
      <LayoutContentSpinner v-if="preferences.transition.loading" />
    </Slot>
    <div class="relative h-full">
      <IFrameRouterView />
      <RouterView v-slot="{ Component, route }">
        <Transition
          v-if="getEnabledTransition"
          :name="getTransitionName(route)"
          appear
          mode="out-in"
        >
          <KeepAlive
            v-if="keepAlive"
            :exclude="getExcludeCachedTabs"
            :include="getCachedTabs"
          >
            <component
              :is="transformComponent(Component, route)"
              v-if="renderRouteView"
              v-show="!route.meta.iframeSrc"
              :key="getTabKey(route)"
            />
          </KeepAlive>
          <component
            :is="Component"
            v-else-if="renderRouteView"
            :key="getTabKey(route)"
          />
        </Transition>
        <template v-else>
          <KeepAlive
            v-if="keepAlive"
            :exclude="getExcludeCachedTabs"
            :include="getCachedTabs"
          >
            <component
              :is="transformComponent(Component, route)"
              v-if="renderRouteView"
              v-show="!route.meta.iframeSrc"
              :key="getTabKey(route)"
            />
          </KeepAlive>
          <component
            :is="Component"
            v-else-if="renderRouteView"
            :key="getTabKey(route)"
          />
        </template>
      </RouterView>
    </div>
  </main>
</template>
