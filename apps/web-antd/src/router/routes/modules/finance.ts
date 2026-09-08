import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wallet',
      order: 200,
      title: $t('page.finance.title'),
    },
    name: 'Finance',
    path: '/finance',
    children: [
      {
        meta: {
          icon: 'lucide:target',
          keepAlive: true,
          title: $t('page.finance.orderFill'),
        },
        name: 'FinanceOrderFill',
        path: '/finance/order-fill',
        component: () => import('#/views/finance/order-fill/index.vue'),
      },
    ],
  },
];

export default routes;
