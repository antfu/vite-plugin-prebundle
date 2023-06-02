import type { Bundler } from '../types'

export const SupportedBundlers = {
  esbuild: (c => import('./esbuild').then(m => m.esbuildBundler(c))) as Bundler,
  vite: (c => import('./vite').then(m => m.viteBundler(c))) as Bundler,
}
