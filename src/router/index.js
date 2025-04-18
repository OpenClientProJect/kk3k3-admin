import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: '/videos',
        name: 'Videos',
        component: () => import('../views/Videos.vue'),
        meta: { title: '视频管理' }
      },
      {
        path: '/video-review',
        name: 'VideoReview',
        component: () => import('../views/VideoReview.vue'),
        meta: { title: '视频审核' }
      },
      {
        path: '/video-detail/:id',
        name: 'VideoDetail',
        component: () => import('../views/VideoDetail.vue'),
        meta: { title: '视频详情' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title} - 视频管理后台`
  
  // 检查是否登录
  const token = localStorage.getItem('adminToken')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router