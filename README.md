# vite-plugin-prebundle

[![NPM version](https://img.shields.io/npm/v/vite-plugin-prebundle?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-prebundle)

Pre-bundle local entries from your Vite app to reduce network requests.

> **Warning**: This plugin is currently an experimental proof-of-concept. Every release may introduce breaking changes. Use at your own risk.

## Why?

Vite is super fast because it only transpiles modules on-demand, and ships the ES modules directly to the browser. However, when working with very large applications, the amount of modules directly affects the number of network requests at the development time. In some cases, it can consume too many resources from the browser and slow down the development experience.

This plugin aims to solve this problem by pre-bundling some local entries that are relatively in scope and not frequently changed into single files. Which could help to reduce the number of network requests and memory consumption.

## Install

```bash
npm i -D vite-plugin-prebundle
```

In your `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import Prebundle from 'vite-plugin-prebundle'

export default defineConfig({
  plugins: [
    Prebundle({
      entries: [
        './src/submodule1/index.ts',
        {
          filepath: './src/submodule2/index.ts',
          bundler: 'vite',
          lazy: true,
          // ...
        }
      ],
    }),
  ],
})
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2023 [Anthony Fu](https://github.com/antfu)
