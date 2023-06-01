import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Prebundle from '../src'

export default defineConfig({
  plugins: [
    Inspect(),
    // comment out this plugin to see the difference
    Prebundle({
      bundleDependencies: true,
      entries: ['./src/submodule/index.ts'],
    }),
  ],

  // we use `lodash-es` as an example of a lot of files, so we turn off the optimization
  optimizeDeps: {
    disabled: true,
    force: true,
  },
})
