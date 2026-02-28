import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmbedView from '../views/EmbedView.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
