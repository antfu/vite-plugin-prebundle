import { join } from './submodule'

const end = Date.now()

declare global {
  interface Window {
    __START__: number
  }
}

document.getElementById('app')!.innerHTML = join(['time to load:', end - window.__START__, 'ms'], ' ')
