import { resolve } from 'node:path'
import { build, mergeConfig } from 'vite'
import type { OutputChunk, RollupOutput } from 'rollup'
import { toArray } from '@antfu/utils'
import type { Bundler } from '../types'

export const viteBundler: Bundler = async ({ viteConfig, viteUserConfig, entry }) => {
  // TODO: support bundleDependencies
  if (entry.options.bundleDependencies)
    throw new Error('vite bundler does not support bundleDependencies yet.')

  const result = await build(mergeConfig(
    entry.options.viteOptions ?? viteUserConfig,
    {
      root: viteConfig.root,
      configFile: false,
      build: {
        minify: false,
        sourcemap: entry.options.sourcemap ?? true,
        lib: {
          entry: entry.resolvedFilepath,
          formats: ['es'],
          fileName: 'prebundle-entry',
        },
        watch: null,
      },
    }),
  ) as RollupOutput

  const outputs = toArray(result).flatMap(i => i.output)

  const codeChunk = outputs.find(i => i.type === 'chunk' && i.isEntry) as OutputChunk

  return {
    code: codeChunk.code,
    map: codeChunk.map
      ? {
          ...codeChunk.map,
          file: entry.resolvedFilepath,
          sources: codeChunk.map.sources.map(i => resolve(viteConfig.root, '_', i)),
        }
      : undefined,
    bundledFiles: Object.keys(codeChunk.modules),
  }
}
