import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { build } from 'esbuild'
import { objectPick } from '@antfu/utils'

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
        bundleDependencies = false,
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
        packages: bundleDependencies ? undefined : 'external',
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

function normalizeEntry(entry: PrebundleEntryOptions | string, defaults?: Partial<PrebundleEntryOptions>): PrebundleEntryOptions {
  return {
    ...defaults,
    ...(typeof entry === 'string'
      ? { filepath: entry }
      : entry
    ),
  }
}

export interface PrebundleOptions extends CommonPrebundleEntryOptions {
  entries: (PrebundleEntryOptions | string)[]
}

export interface CommonPrebundleEntryOptions {
  /**
   * The bundler used to bundle the entries.
   *
   * @default 'esbuild'
   * @todo
   */
  bundler?: 'esbuild' | 'vite'

  /**
   * Persistent cache store in the file system.
   * @todo
   */
  persistentCache?: boolean

  /**
   * Prebundle also the dependencies of the entry.
   *
   * @default false
   */
  bundleDependencies?: boolean
}

export interface PrebundleEntryOptions extends CommonPrebundleEntryOptions {
  /**
   * The entry file path.
   */
  filepath: string
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
