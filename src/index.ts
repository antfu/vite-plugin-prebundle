import { Buffer } from 'node:buffer'
import { normalize, relative, resolve } from 'pathe'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import { objectPick } from '@antfu/utils'
import createDebug from 'debug'
import type { Bundler, PrebundleEntryData, PrebundleEntryOptions, PrebundleOptions } from './types'
import { SupportedBundlers } from './bundler'

const NAME = 'vite-plugin-prebundle'
const debug = createDebug(NAME)

export * from './types'

export default function PrebundlePlugin(options: PrebundleOptions): Plugin {
  let userConfig: UserConfig
  let config: ResolvedConfig
  let entriesMap: Map<string, PrebundleEntryData>

  async function bundleById(id: string) {
    const entry = entriesMap.get(id)!

    // TODO: peristent cache

    if (!entry.cache) {
      entry.promise ||= run()
      await entry.promise
    }

    return {
      code: entry.cache!.code,
      map: entry.cache!.map,
    }

    async function run() {
      const {
        bundler,
      } = entry.options

      if (typeof bundler !== 'function' && !(bundler in SupportedBundlers))
        throw new Error(`[${NAME}] Bundler ${bundler} is not supported yet.`)

      const bundlerFn: Bundler = typeof bundler === 'function'
        ? bundler
        : (SupportedBundlers as any)[bundler]

      debug(`start bundling ${relative(config.root, id)}`)

      const start = Date.now()
      const result = await bundlerFn({
        viteUserConfig: userConfig,
        viteConfig: config,
        options,
        entry,
      })

      debug(`bundled ${relative(config.root, id)}`)
      debug(`finished in ${Date.now() - start}ms, ${result.bundledFiles.length} files into ${(Buffer.byteLength(result.code, 'utf-8') / 1024).toFixed(2)} KB`)

      entry.cache = {
        ...result,
        time: Date.now(),
      }
    }
  }

  return {
    name: NAME,
    apply: 'serve',
    config(_config) {
      userConfig = _config
    },
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      const defaults = objectPick(options, ['bundler', 'persistentCache', 'bundleDependencies'])
      entriesMap = new Map(options.entries.map((i) => {
        const entry = normalizeEntry(i, defaults)
        const resolved = resolve(config.root, entry.filepath)
        return [resolved, { options: entry, resolvedFilepath: resolved }] as const
      }))

      Array.from(entriesMap.values())
        .map((i) => {
          if (i.options.lazy)
            return null
          return bundleById(i.resolvedFilepath).catch(e => this.error(e))
        })
    },
    handleHotUpdate(ctx) {
      const filepath = normalize(ctx.file)
      const matched = Array.from(entriesMap.values())
        .filter(data => data.cache?.bundledFiles?.includes(filepath))

      if (!matched.length)
        return

      return matched.flatMap((data) => {
        data.cache = undefined
        data.promise = undefined
        return [...ctx.server.moduleGraph.getModulesByFile(data.resolvedFilepath) || []]
      })
    },
    async load(id) {
      if (!entriesMap.has(id)) {
        // duplicate detection
        const entry = Array.from(entriesMap.values()).find((i) => {
          if (!i.options.duplicateDetection)
            return false
          return i.cache?.bundledFiles?.includes(id)
        })
        if (entry) {
          const message = `${relative(config.root, id)} has been prebundled, but being imported by another module`
          if (entry.options.duplicateDetection === 'error')
            throw this.error(message)
          else
            this.warn(message)
        }
        return
      }

      return bundleById(id)
    },
  }
}

function normalizeEntry(entry: PrebundleEntryOptions | string, defaults?: Partial<PrebundleEntryOptions>): Required<PrebundleEntryOptions> {
  return {
    duplicateDetection: 'warn',
    sourcemap: true,
    bundler: 'esbuild',
    bundleDependencies: false,
    persistentCache: false,
    lazy: false,
    viteOptions: null,
    esbuildOptions: null,
    ...defaults,
    ...(typeof entry === 'string'
      ? { filepath: entry }
      : entry
    ),
  }
}
