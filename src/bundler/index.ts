import type { Bundler } from '../types'

export const SupportedBundlers = {
  esbuild: (c => import('./esbuild').then(m => m.esbuildBundler(c))) as Bundler,
}
