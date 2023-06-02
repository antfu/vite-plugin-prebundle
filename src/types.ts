import type { ResolvedConfig, UserConfig } from 'vite'
import type { SourceMap } from 'rollup'
import type { BuildOptions } from 'esbuild'

export interface PrebundleOptions extends CommonPrebundleEntryOptions {
  entries: (PrebundleEntryOptions | string)[]
}

export interface CommonPrebundleEntryOptions {
  /**
   * The bundler used to bundle the entries.
   *
   * @default 'esbuild'
   * @todo support rollup/vite bundler that reuses the existing plugins
   */
  bundler?: 'esbuild' | 'vite' | Bundler

  /**
   * Vite options for prebundling.
   *
   * By default the main Vite config will be used.
   * When explicitly provided, the main Vite config will be ignored.
   */
  viteOptions?: UserConfig | null

  /**
   * esbuild options for prebundling.
   *
   * By default the `optimizeDeps.esbuildOptions` will be used.
   * When explicitly provided, the default esbuild options will be ignored.
   */
  esbuildOptions?: BuildOptions | null

  /**
   * Prebundle also the dependencies of the entry.
   *
   * @default false
   */
  bundleDependencies?: boolean

  /**
   * Persistent cache store in the file system.
   * @todo also support custom hashing
   */
  persistentCache?: boolean

  /**
   * Generate sourcemap.
   *
   * @default true
   */
  sourcemap?: boolean

  /**
   * Warn if prebundled entires are duplicated.
   *
   * @default 'warn'
   */
  duplicateDetection?: 'warn' | 'error' | false

  /**
   * Prebundle the entries when module has been imported.
   *
   * @default false
   */
  lazy?: boolean
}

export interface PrebundleEntryOptions extends CommonPrebundleEntryOptions {
  /**
   * The entry file path.
   */
  filepath: string
}

export interface PrebundleEntryData {
  resolvedFilepath: string
  options: Required<PrebundleEntryOptions>
  cache?: PrebundleEntryCache
  /**
   * The promise of the existing bundling process.
   */
  promise?: Promise<void>
}

export interface PrebundleEntryCache extends BundlerResult {
  time: number
}

export interface BundlerContext {
  viteConfig: ResolvedConfig
  viteUserConfig: UserConfig
  options: PrebundleOptions
  entry: PrebundleEntryData
}

export interface BundlerResult {
  /**
   * The bundled code.
   */
  code: string
  /**
   * Source map.
   */
  map?: SourceMap | null
  /**
   * List of file paths that are bundled.
   *
   * Used for watching and doing HMR.
   */
  bundledFiles: string[]
}

export type Bundler = (ctx: BundlerContext) => BundlerResult | Promise<BundlerResult>
