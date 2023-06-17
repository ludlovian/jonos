import polka from 'polka'
import Debug from 'debug'

import { staticFiles, parseBody, log, wrap, getPlayer } from './wares.mjs'
import { serverPort, clientPath } from './config.mjs'
import { handleEvent } from './sonos/index.mjs'
import {
  statusUpdates as apiStatusUpdates,
  status as apiStatus,
  setVolume as apiSetVolume,
  setMute as apiSetMute,
  setLeader as apiSetLeader,
  playNotify as apiPlayNotify,
  pause as apiPause,
  play as apiPlay
} from './handlers.mjs'

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
      .use('/notify', parseBody())
      .all('/notify/:name/:service', handleEvent)

      // API
      .use('/api', log, parseBody({ json: true }), getPlayer)
      .get('/api/status/updates', wrap(apiStatusUpdates))
      .get('/api/status', wrap(apiStatus))
      .post('/api/volume/:name', wrap(apiSetVolume))
      .post('/api/mute/:name', wrap(apiSetMute))
      .post('/api/leader/:name', wrap(apiSetLeader))
      .post('/api/notify/:name', wrap(apiPlayNotify))
      .post('/api/pause/:name', wrap(apiPause))
      .post('/api/play/:name', wrap(apiPlay))

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
