import { spawn, spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const COMPILER = resolve(here, 'compile-help.mjs')
const HELP_DIR = resolve(here, '..', '..', 'help')

/**
 * Compiles help/docs before every build and, in the dev server, whenever a
 * help page or the tree changes, then reloads the browser. The compiler runs
 * in its own process so a content error prints as one line per finding and
 * fails the build the way `mkdocs build --strict` did (ADR 0006).
 *
 * In the dev server the first compile runs from the `config` hook, before
 * Vite scans `public/`: the compiler writes the help assets there, and a
 * file Vite has not seen at start falls through to the SPA page. Later
 * compiles run off the event loop and are coalesced, so a burst of saves
 * (an editor writing many pages) costs one compile, not one per file.
 */
export default function helpPlugin() {
  let compiledForServe = false
  const compileSync = (extra = []) => {
    const result = spawnSync(process.execPath, [COMPILER, ...extra], { stdio: 'inherit' })
    if (result.status !== 0) throw new Error('help content failed to compile; see the lines above')
  }
  const compileAsync = () =>
    new Promise((done, fail) => {
      const child = spawn(process.execPath, [COMPILER], { stdio: 'inherit' })
      child.on('exit', (code) =>
        code === 0 ? done() : fail(new Error('help content failed to compile')),
      )
      child.on('error', fail)
    })
  return {
    name: 'carbonos-help',
    config(_config, { command }) {
      if (command === 'serve') {
        compileSync(['--if-present'])
        compiledForServe = true
      }
    },
    buildStart() {
      if (!compiledForServe) compileSync(['--if-present'])
    },
    configureServer(server) {
      let timer = null
      let running = null
      let pending = false
      const run = async () => {
        if (running) {
          pending = true
          return
        }
        running = compileAsync()
          .then(() => server.ws.send({ type: 'full-reload' }))
          .catch((error) => server.config.logger.error(String(error)))
          .finally(() => {
            running = null
            if (pending) {
              pending = false
              void run()
            }
          })
      }
      server.watcher.add(HELP_DIR)
      server.watcher.on('all', (_event, path) => {
        if (!path.startsWith(HELP_DIR)) return
        clearTimeout(timer)
        timer = setTimeout(() => void run(), 300)
      })
    },
  }
}
