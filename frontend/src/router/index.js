import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserSettingsView from '../views/UserSettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/user_settings',
    name: 'UserSettings',
    component: UserSettingsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
