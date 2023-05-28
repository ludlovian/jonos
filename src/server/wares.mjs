import tinydate from 'tinydate'
import sirv from 'sirv'

export const staticFiles = sirv('src/client', { dev: true })

export async function parseBody (req, res, next) {
  if (req.method !== 'POST') return next()
  req.setEncoding('utf-8')
  let data = ''
  for await (const chunk of req) {
    data += chunk
  }
  req.body = data
  try {
    req.json = JSON.parse(data)
  } catch (e) {
    next(e)
  }
  next()
}

const fmtDate = tinydate('{DDD} {D} {MMM} {HH}:{MM}', {
  D: d => d.getDate(),
  DDD: d => d.toLocaleString('default', { weekday: 'short' }),
  MMM: d => d.toLocaleString('default', { month: 'short' })
})

export function log (req, res, next) {
  const now = new Date()
  res.once('finish', () => log.writeLine(req, res, now))
  next()
}

log.writeLine = function (req, res, dt) {
  const when = fmtDate(dt || new Date())

  const { statusCode } = res
  const { method, path } = req
  const s = [when, method, path, statusCode].filter(Boolean).join(' - ')
  console.log(s)
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
