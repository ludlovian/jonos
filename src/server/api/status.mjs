import Debug from '@ludlovian/debug'
import send from '@polka/send-type'
import { serialize } from 'pixutil/json'

import model from '../model/index.mjs'
import { log } from '../wares.mjs'

const debug = Debug('jonos:server')

export async function apiStatusUpdates (req, res) {
  debug('apiStatusUpdates: started')

  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })
  log.writeLine(req, res)

  const stopListen = model.listen(sendState)
  req.on('close', stop)

  function sendState (state) {
    const data = JSON.stringify(serialize(state))
    res.write(`data: ${data}\n\n`)
  }

  function stop () {
    debug('apiStatusUpdates: stopped')
    stopListen()
  }
}

export async function apiStatus (req, res) {
  debug('apiStatus')
  send(res, 200, serialize(model.state))
}
