import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/views/system/NotFoundView.vue'),
    meta: {
      title: 'Not found',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]
