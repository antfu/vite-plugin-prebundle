import { resolve } from 'pathe'
import { build } from 'esbuild'
import type { Bundler } from '../types'

export const esbuildBundler: Bundler = async ({ viteConfig, entry }) => {
  const {
    bundleDependencies = false,
  } = entry.options

  const result = await build({
    ...viteConfig?.optimizeDeps.esbuildOptions,
    entryPoints: [entry.resolvedFilepath],
    write: false,
    format: 'esm',
    bundle: true,
    metafile: true,
    sourceRoot: viteConfig.root,
    packages: bundleDependencies ? undefined : 'external',
  })

  const code = result.outputFiles[0].text

  const bundledFiles = Object.keys(result.metafile!.inputs)
    .map(i => resolve(viteConfig.root, i))

  return {
    code,
    bundledFiles,
  }
}
