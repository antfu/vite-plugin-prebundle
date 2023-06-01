import { resolve as pResolve } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { build } from 'esbuild'

export default function PrebundlePlugin(options: PrebundleOptions): Plugin {
  let config: ResolvedConfig
  let resolvedIds: Map<string, PrebundleEntry>
  const entries = normalizeEntries(options.entries)

  return {
    name: 'vite-plugin-prebundle',
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      resolvedIds = new Map(entries.map((entry) => {
        return [pResolve(config.root, entry.filepath), entry] as const
      }))
    },
    async load(id) {
      if (!resolvedIds.has(id))
        return

      const {
        bundler = 'esbuild',
      } = resolvedIds.get(id)!

      if (bundler !== 'esbuild')
        throw new Error(`Bundler ${bundler} is not supported yet.`)

      const result = await build({
        ...config.optimizeDeps.esbuildOptions,
        entryPoints: [id],
        write: false,
        format: 'esm',
        bundle: true,
      })

      return result.outputFiles[0].text
    },
  }
}

function normalizeEntries(entries: (PrebundleEntry | string)[]): PrebundleEntry[] {
  return entries.map((entry) => {
    if (typeof entry === 'string')
      return { filepath: entry }
    return entry
  })
}

export interface PrebundleOptions {
  entries: (PrebundleEntry | string)[]
}

export interface PrebundleEntry {
  filepath: string
  /**
   * @default 'esbuild'
   * @todo
   */
  bundler?: 'esbuild' | 'vite'
  /**
   * @todo
   */
  cache?: boolean
}
