import Timer from '@ludlovian/timer'
import model from '@ludlovian/jonos-model'

import config from '../config.mjs'

export async function apiStatus (req, res) {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })

  const tmHeartbeat = new Timer({
    ms: config.heartbeatPeriod,
    repeat: true,
    fn: () => res.write(':\n\n')
  })

  const unsubscribe = model.subscribe(sendChanges)
  req.on('close', stop)

  function sendChanges (changes) {
    const data =
      changes
        .map(change => JSON.stringify(change))
        .map(data => 'data: ' + data)
        .join('\n') + '\n\n'

    res.write(data)
  }

  function stop () {
    tmHeartbeat.cancel()
    unsubscribe()
  }
}
