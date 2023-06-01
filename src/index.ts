import path from 'node:path'
import { Buffer } from 'node:buffer'
import type { Plugin, ResolvedConfig } from 'vite'
import { objectPick } from '@antfu/utils'
import createDebug from 'debug'
import type { Bundler, PrebundleEntryData, PrebundleEntryOptions, PrebundleOptions } from './types'
import { SupportedBundlers } from './bundler'

const NAME = 'vite-plugin-prebundle'
const debug = createDebug(NAME)

export * from './types'

export default function PrebundlePlugin(options: PrebundleOptions): Plugin {
  let config: ResolvedConfig
  let entriesMap: Map<string, PrebundleEntryData>

  return {
    name: NAME,
    apply: 'serve',
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      const defaults = objectPick(options, ['bundler', 'persistentCache', 'bundleDependencies'])
      entriesMap = new Map(options.entries.map((i) => {
        const entry = normalizeEntry(i, defaults)
        const resolved = path.resolve(config.root, entry.filepath)
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

      const entry = entriesMap.get(id)!
      const {
        bundler = 'esbuild',
      } = entry.options

      // TODO: peristent cache

      if (typeof bundler !== 'function' && !(bundler in SupportedBundlers))
        throw new Error(`[${NAME}] Bundler ${bundler} is not supported yet.`)

      const bundlerFn: Bundler = typeof bundler === 'function'
        ? bundler
        : (SupportedBundlers as any)[bundler]

      const start = Date.now()
      const result = await bundlerFn({
        viteConfig: config,
        options,
        entry,
      })

      debug(`bundled ${id}`)
      debug(`finished in ${Date.now() - start}ms, ${result.bundledFiles.length} files into ${(Buffer.byteLength(result.code, 'utf-8') / 1024).toFixed(2)} KB`)

      entry.cache = {
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
