import Debug from 'debug'
import sirv from 'sirv'
import send from '@polka/send-type'

import { isDev } from './config.mjs'
import { players } from './model/index.mjs'

const writeToConsole = Debug('jonos*')

export const staticFiles = path =>
  sirv(path, {
    dev: isDev,
    gzip: !isDev,
    etag: !isDev
  })

export function parseBody (opts = {}) {
  const { json = false, methods = ['POST', 'NOTIFY'] } = opts
  return async (req, res, next) => {
    if (!methods.includes(req.method) || req._bodyParsed) return next()

    req.setEncoding('utf-8')
    let body = ''
    for await (const chunk of req) body += chunk
    if (body) req.body = body
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
      writeToConsole(err)
      res.statusCode = err.statusCode || 500
      res.end(err.message)
    }
  }
}

export function getPlayer (req, res, next) {
  if (!('name' in req.params)) return next()
  const player = players.byName[req.params.name]
  if (!player) return send(res, 404, 'Unknown player')
  req.player = player
  next()
}
