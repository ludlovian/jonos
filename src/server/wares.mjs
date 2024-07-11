import { resolve } from 'node:path'
import Debug from '@ludlovian/debug'
import send from '@polka/send'
import model from '@ludlovian/jonos-model'
import _staticFile from '@ludlovian/static'

const writeToConsole = Debug('jonos*')
const debug = Debug('jonos:server')

export function staticFiles (root, except) {
  return _staticFile.serveFiles(root, {
    single: '/index.html',
    filter: path => except.some(e => path.startsWith(e))
  })
}
staticFiles.onStart = async root => {
  root = resolve(root)
  debug('Refreshing static files...')
  await _staticFile.cache.refresh()
  debug('Fetching cover art...')
  const isCoverArt = name => name.endsWith('.jpg')
  await _staticFile.cache.prefetch(root, isCoverArt)
  debug('Static refresh complete')
}

export function parseBody (opts = {}) {
  const { json = false, methods = ['POST'] } = opts
  return async (req, res, next) => {
    if (!methods.includes(req.method) || req._bodyParsed) return next()

    req.setEncoding('utf-8')
    let body = ''
    for await (const chunk of req) body += chunk
    req.body = body
    req._bodyParsed = true

    if (json) {
      req.json = {}
      if (body) {
        try {
          req.json = JSON.parse(body)
        } catch (e) {
          next(e)
        }
      }
    }
    next()
  }
}

export function log (req, res, next) {
  res.once('finish', () => log.writeLine(req, res))
  next()
}

log.writeLine = function (req, res) {
  const { statusCode } = res
  const { method, path } = req
  const s = [method, path, statusCode].filter(Boolean).join(' - ')
  writeToConsole(s)
}

export function wrap (handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error(err)
      res.statusCode = err.statusCode || 500
      res.end(err.message)
    }
  }
}

export function getPlayer (req, res, next) {
  if (req?.params?.name == null) return next()
  const player = model.players.byName.get(req.params.name)
  if (!player) return send(res, 404, 'Unknown player')
  req.player = player
  next()
}
