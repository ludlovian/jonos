import polka from 'polka'
import send from '@polka/send-type'
import makeSerial from 'pixutil/serial'

import getStatus from './status.mjs'
import renderStatus from './renderStatus.mjs'

import preset from './preset.mjs'
import notify from './notify.mjs'

const wrap = handler => async (req, res) =>
  handler(req, res).catch(err => send(res, 500, err.message))
const serial = makeSerial()

const app = polka()
app.get('/', wrap(doIndex))
app.post('/preset/:name', wrap(doPreset))
app.post('/notify/:message/:player', wrap(doNotify))
app.use(logCall)

export default app

function logCall (req, res, next) {
  const { method, path, search } = req
  res.once('finish', () => {
    const code = res.statusCode
    console.log(`${method} - ${path}${search || ''} - ${code}`)
  })
  next()
}

async function doIndex (req, res) {
  const headers = { 'content-type': 'text/html;charset=utf-8' }
  send(res, 200, renderStatus(await getStatus()), headers)
}

async function doPreset (req, res) {
  const { name } = req.params
  await serial.exec(() => preset(name))
  send(res, 200)
}

async function doNotify (req, res) {
  const { message, player } = req.params
  const { volume = 50, resume = false, timeout = '10s' } = req.query
  await serial.exec(() => notify({ message, player, volume, timeout, resume }))
  send(res, 200)
}
