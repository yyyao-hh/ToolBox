// export * from './create-icon';

export { default as Icon } from './icon.vue';

export * from './iconify';
export { default as EmptyIcon } from './icons/empty-icon.vue';
export * from './svg';

export * from './lucide';

export type { IconifyIcon as IconifyIconStructure } from '@iconify/vue';
export {
  addCollection,
  addIcon,
  Icon as IconifyIcon,
  listIcons,
} from '@iconify/vue';
