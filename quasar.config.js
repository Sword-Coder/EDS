import { configure } from 'quasar/wrappers'

export default configure(() => ({
  boot: [],
  css: ['app.scss'],
  extras: ['material-icons'],

  build: {
    vueRouterMode: 'history'
  },

  devServer: {
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3306',
        changeOrigin: true
      }
    }
  },

  framework: {
    config: {},
    plugins: ['Dialog', 'Notify']
  },

  animations: [],

  sourceFiles: {
    rootComponent: 'src/App.vue',
    router: 'src/router/index',
    store: 'src/stores/index'
  }
}))
