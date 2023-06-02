import { createApp } from 'vue'
import Component from './component.vue'

export function mountVue() {
  const app = createApp(Component)
  app.mount('#app')
  return app
}
