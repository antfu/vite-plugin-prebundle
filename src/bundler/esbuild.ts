import { resolve } from 'pathe'
import { build } from 'esbuild'
import type { Bundler } from '../types'

export const esbuildBundler: Bundler = async ({ viteConfig, entry }) => {
  const result = await build({
    ...(entry.options.esbuildOptions || viteConfig?.optimizeDeps.esbuildOptions),
    bundle: true,
    metafile: true,
    sourcemap: entry.options.sourcemap,
    sourceRoot: viteConfig.root,
    packages: entry.options.bundleDependencies ? undefined : 'external',
    entryPoints: [entry.resolvedFilepath],
    format: 'esm',
    write: false,
  })

  const code = result.outputFiles[0].text

  const bundledFiles = Object.keys(result.metafile!.inputs)
    .map(i => resolve(viteConfig.root, i))

  return {
    code,
    bundledFiles,
  }
}
