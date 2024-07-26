import Timer from '@ludlovian/timer'
import model from '@ludlovian/jonos-model'

import config from '../config.mjs'
import { log } from '../wares.mjs'

export async function apiStatus (req, res) {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })
  log.writeLine(req, res)

  const tmHeartbeat = new Timer({
    ms: config.heartbeatPeriod,
    repeat: true,
    fn: () => res.write(':\n\n')
  })

  const unsubscribe = model.subscribe(sendState, { depth: 3 })
  req.on('close', stop)

  function sendState (state) {
    const data = JSON.stringify(state)
    res.write(`data: ${data}\n\n`)
  }

  function stop () {
    tmHeartbeat.cancel()
    unsubscribe()
  }
}
