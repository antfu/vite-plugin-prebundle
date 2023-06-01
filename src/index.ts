import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { build } from 'esbuild'

export default function PrebundlePlugin(options: PrebundleOptions): Plugin {
  let config: ResolvedConfig
  let entriesMap: Map<string, PrebundleEntryData>
  const entries = normalizeEntries(options.entries)

  return {
    name: 'vite-plugin-prebundle',
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      entriesMap = new Map(entries.map((entry) => {
        const resolved = path.resolve(config.root, entry.filepath)
        return [resolved, { options: entry, resolvedFilepath: resolved }] as const
      }))
    },
    handleHotUpdate(ctx) {
      const matched = Array.from(entriesMap.values())
        .filter((data) => {
          return data.inputs?.includes(ctx.file)
        })
      if (!matched.length)
        return
      return matched.flatMap(data => [...ctx.server.moduleGraph.getModulesByFile(data.resolvedFilepath) || []])
    },
    async load(id) {
      if (!entriesMap.has(id))
        return

      const data = entriesMap.get(id)!
      const {
        bundler = 'esbuild',
      } = data.options

      // TODO: cache

      if (bundler !== 'esbuild')
        throw new Error(`Bundler ${bundler} is not supported yet.`)

      const result = await build({
        ...config.optimizeDeps.esbuildOptions,
        entryPoints: [id],
        write: false,
        format: 'esm',
        bundle: true,
        metafile: true,
        sourceRoot: config.root,
        // TODO: we should externalize deps, as they should be handled by Vite
      })

      const code = result.outputFiles[0].text

      const inputs = Object.keys(result.metafile!.inputs)
        .filter(i => !i.match(/[\/\\]node_modules[\/\\]/))
        .map(i => path.resolve(config.root, i))

      data.inputs = inputs
      data.cache = {
        code,
        time: Date.now(),
      }

      return result.outputFiles[0].text
    },
  }
}

function normalizeEntries(entries: (PrebundleEntryOptions | string)[]): PrebundleEntryOptions[] {
  return entries.map((entry) => {
    if (typeof entry === 'string')
      return { filepath: entry }
    return entry
  })
}

export interface PrebundleOptions {
  entries: (PrebundleEntryOptions | string)[]
}

export interface PrebundleEntryOptions {
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

export interface PrebundleEntryData {
  resolvedFilepath: string
  options: PrebundleEntryOptions
  inputs?: string[]
  cache?: PrebundleEntryCache
}

export interface PrebundleEntryCache {
  code: string
  time: number
}
