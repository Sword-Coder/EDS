import MainLayout from '../layouts/MainLayout.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import LeadsPage from '../pages/LeadsPage.vue'

export default [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage
      },
      {
        path: 'leads',
        name: 'leads',
        component: LeadsPage
      }
    ]
  }
]
