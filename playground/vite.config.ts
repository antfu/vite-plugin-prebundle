import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import Prebundle from '../src'

// change this to see the difference
const ENABLED = true

export default defineConfig({
  plugins: [
    Inspect(),
    Vue(),
    ENABLED && Prebundle({
      entries: [
        {
          filepath: './src/submodule1/index.ts',
          bundler: 'esbuild',
          bundleDependencies: true,
        },
        {
          filepath: './src/submodule2/index.ts',
          bundler: 'vite',
          viteOptions: {
            plugins: [
              Vue(),
            ],
          },
        },
      ],
    }),
  ],

  // we use `lodash-es` as an example of a lot of files, so we turn off the optimization
  optimizeDeps: {
    disabled: true,
    force: true,
  },
})
