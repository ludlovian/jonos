import polka from 'polka'
import Debug from '@ludlovian/debug'

import {
  staticFiles,
  parseBody,
  log,
  wrap,
  getPlayer,
  touchModel
} from './wares.mjs'
import { serverPort, clientPath } from './config.mjs'
import { handleEvent } from './sonos/index.mjs'
import {
  apiStatus,
  apiStatusUpdates,
  apiPlayerVolume,
  apiPlayerMute,
  apiPlayerLeader,
  apiPlayerPlay,
  apiPlayerPause,
  apiCommandPreset,
  apiCommandNotify
} from './api/index.mjs'

class Server {
  static get instance () {
    return (this._instance = this._instance || new Server())
  }

  debug = Debug('jonos:server')

  start (opts = {}) {
    const p = (this.polka = polka())

    // static files for client
    p.use(staticFiles(clientPath))

      // sonos notifications
      .use('/notify', parseBody(), getPlayer)
      .all('/notify/:name/:service', handleEvent)

      // API
      .use('/api', touchModel, log, parseBody({ json: true }), getPlayer)

      // Status
      .get('/api/status/updates', wrap(apiStatusUpdates))
      .get('/api/status', wrap(apiStatus))

      // Player
      .post('/api/player/:name/volume', wrap(apiPlayerVolume))
      .post('/api/player/:name/mute', wrap(apiPlayerMute))
      .post('/api/player/:name/leader', wrap(apiPlayerLeader))
      .post('/api/player/:name/pause', wrap(apiPlayerPause))
      .post('/api/player/:name/play', wrap(apiPlayerPlay))

      // Commands
      .post('/api/command/preset/:preset', wrap(apiCommandPreset))
      .post('/api/command/notify/:notify', wrap(apiCommandNotify))

    // start listening
    return new Promise((resolve, reject) => {
      p.listen(serverPort, '0.0.0.0', err => {
        if (err) return reject(err)
        this.debug('Listening on port %d', serverPort)
        resolve(true)
      })
      p.server.on('error', reject)
    })
  }
}

export const server = Server.instance
