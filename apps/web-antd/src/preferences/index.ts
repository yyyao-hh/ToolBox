import type { Preferences } from './types';
import type { DeepPartial } from '#/types';

import { preferencesManager } from './preferences';

// 偏好设置（带有层级关系）
const preferences: Preferences =
  preferencesManager.getPreferences.apply(preferencesManager);

export { preferences, preferencesManager };

export * from './constants';
export type * from './types';
export * from './use-preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences: DeepPartial<Preferences> = {
  app: {
    name: import.meta.env.VITE_APP_TITLE,
  },
};
