import type { ResolvedConfig } from 'vite'

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
  bundler?: 'esbuild' | Bundler

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
  cache?: PrebundleEntryCache
}

export interface PrebundleEntryCache extends BundlerResult {
  time: number
}

export interface BundlerContext {
  viteConfig: ResolvedConfig
  options: PrebundleOptions
  entry: PrebundleEntryData
}

export interface BundlerResult {
  code: string
  /**
   * List of file paths that are bundled.
   *
   * Used for watching and doing HMR.
   */
  bundledFiles: string[]
}

export type Bundler = (ctx: BundlerContext) => BundlerResult | Promise<BundlerResult>
