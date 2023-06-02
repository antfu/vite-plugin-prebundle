import { hello, join } from './submodule1'
import { mountVue } from './submodule2'

const end = Date.now()

declare global {
  interface Window {
    __START__: number
  }
}

document.getElementById('root')!.innerHTML = [
  join(['time to load:', end - window.__START__, 'ms'], ' '),
  hello(),
].join('<br>')

mountVue()

// uncomment below to trigger conflicts warning
// import('./submodule/hello')
