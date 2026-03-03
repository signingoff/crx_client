import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmbedView from '../views/EmbedView.vue'
import XueqiuView from '../views/XueqiuView.vue'
import XueqiuSettingsView from '../views/XueqiuSettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/embed',
    name: 'Embed',
    component: EmbedView
  },
  {
    path: '/xueqiu',
    name: 'Xueqiu',
    component: XueqiuView
  },
  {
    path: '/xueqiu/settings',
    name: 'XueqiuSettings',
    component: XueqiuSettingsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
