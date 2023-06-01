import path, { sep } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { objectPick } from '@antfu/utils'
import type { Bundler, PrebundleEntryData, PrebundleEntryOptions, PrebundleOptions } from './types'
import { SupportedBundlers } from './bundler'

export * from './types'

export default function PrebundlePlugin(options: PrebundleOptions): Plugin {
  let config: ResolvedConfig
  let entriesMap: Map<string, PrebundleEntryData>

  return {
    name: 'vite-plugin-prebundle',
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      const defaults = objectPick(options, ['bundler', 'persistentCache', 'bundleDependencies'])
      entriesMap = new Map(options.entries.map((i) => {
        const entry = normalizeEntry(i, defaults)
        const resolved = normalizePath(path.resolve(config.root, entry.filepath))
        return [resolved, { options: entry, resolvedFilepath: resolved }] as const
      }))
    },
    handleHotUpdate(ctx) {
      const matched = Array.from(entriesMap.values())
        .filter((data) => {
          return data.cache?.bundledFiles?.includes(ctx.file)
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

      if (typeof bundler !== 'function' && !(bundler in SupportedBundlers))
        throw new Error(`Bundler ${bundler} is not supported yet.`)

      const bundlerFn: Bundler = typeof bundler === 'function'
        ? bundler
        : (SupportedBundlers as any)[bundler]

      const result = await bundlerFn({
        viteConfig: config,
        options,
        entry: data,
      })

      data.cache = {
        ...result,
        time: Date.now(),
      }

      // TODO: sourcemap
      return result.code
    },
  }
}

function normalizeEntry(entry: PrebundleEntryOptions | string, defaults?: Partial<PrebundleEntryOptions>): PrebundleEntryOptions {
  return {
    ...defaults,
    ...(typeof entry === 'string'
      ? { filepath: entry }
      : entry
    ),
  }
}
function normalizePath(path: string) {
  return path.split(sep).join('/')
}
