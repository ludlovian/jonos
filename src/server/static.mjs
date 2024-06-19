import { resolve, join } from 'node:path'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

import Debug from '@ludlovian/debug'

import { lookup } from 'mrmime'

const debug = Debug('jonos:static')

export default class StaticFile {
  static eTag = true
  static encodings = [['.gz', 'gzip']]
  static #cached = new Map()

  #path
  #stats
  #headers

  constructor (path, stats) {
    this.#path = path
    this.#stats = stats
    this.#headers = {}

    const [ext, enc] = StaticFile.encodings.find(([ext]) =>
      path.endsWith(ext)
    ) ?? ['', undefined]

    if (enc) {
      path = path.slice(0, -ext.length)
      this.#headers['Content-Encoding'] = enc
    }

    let ctype = lookup(path) ?? ''
    if (ctype === 'text/html') ctype += ';charset=utf-8'

    Object.assign(this.#headers, {
      'Content-Length': stats.size,
      'Content-Type': ctype,
      'Last-Modified': stats.mtime.toUTCString()
    })

    if (StaticFile.eTag) {
      this.#headers.ETag = `W/${stats.size}-${+stats.mtime}`
    }
  }

  send (req, res) {
    let code = 200
    const opts = {}
    const headers = { ...this.#headers }
    for (const k of Object.keys(headers)) {
      if (res.getHeader(k)) headers[k] = res.getHeader(k)
    }

    if (StaticFile.eTag) {
      if (req.headers['if-none-match'] === headers.ETag) {
        res.writeHead(304)
        return res.end()
      }
    }

    debug('Sending %s', this.#path)
    if (req.headers.range) {
      code = 206
      const [x, y] = req.headers.range.replace('bytes=', '').split('-')
      const { size } = this.#stats
      const a = parseInt(y, 10) ?? size - 1
      const b = parseInt(x, 10) ?? 0

      if (a > b || a < 0 || b >= size) {
        res.setHeader('Content-Range', `bytes */${size}`)
        res.statusCode = 416
        return res.end()
      }
      opts.start = a
      opts.end = b
      headers['Content-Range'] = `bytes ${a}-${b}/${size}`
      headers['Content-Length'] = b - a + 1
      headers['Accept-Ranges'] = 'bytes'
    }
    res.writeHead(code, headers)
    if (req.method === 'HEAD') return res.end()
    createReadStream(this.#path, opts).pipe(res)
  }

  // --- Static methods -----------------------------

  static async sendFile (filePath, req, res) {
    const paths = [filePath]
    const reqEnc = req.headers['accept-encoding'] ?? ''
    for (const [ext, enc] of this.encodings) {
      if (reqEnc.includes(enc)) paths.unshift(filePath + ext)
    }
    for (const path of paths) {
      const file = this.#cached.get(path) ?? (await this.#findFile(path))
      if (file) {
        file.send(req, res)
        return true
      }
    }
    return false
  }

  static async #findFile (filePath) {
    try {
      const stats = await stat(filePath)
      const file = new StaticFile(filePath, stats)
      this.#cached.set(filePath, file)
      return file
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      this.#cached.set(filePath, undefined)
      return undefined
    }
  }

  static serveFiles (root, opts = {}) {
    let { single, except = [] } = opts
    if (single) {
      single = addIndexToPath(single === true ? '/' : single)
    }
    except = except.map(stripLeadingSlash)
    const isException = path => except.some(e => path.startsWith(e))

    root = resolve(root)
    return async (req, res, next) => {
      let path = new URL(`http://localhost${req.url}`).pathname
      path = stripLeadingSlash(addIndexToPath(path))
      const paths = [path]
      if (single && !isException(path)) paths.push(single)

      for (path of paths) {
        path = join(root, path)
        if (await this.sendFile(path, req, res)) return
      }
      next()
    }
  }
}

function addIndexToPath (path) {
  return path.endsWith('/') ? path + 'index.html' : path
}

function stripLeadingSlash (path) {
  return path.startsWith('/') ? path.slice(1) : path
}
