import polka from 'polka'
import Debug from '@ludlovian/debug'

import { staticFiles, parseBody, wrap, getPlayer } from './wares.mjs'

import config from './config.mjs'
import {
  apiStatus,
  apiPreset,
  apiNotify,
  apiPlayerVolume,
  apiPlayerPlay,
  apiPlayerPause,
  apiPlayerLeader,
  apiPlayerLoad,
  apiSearch
} from './api/index.mjs'
import artwork from './artwork.mjs'

class Server {
  static #instance
  #debug = Debug('jonos:server')
  #polka

  static get instance () {
    return (Server.#instance = Server.#instance ?? new Server())
  }

  async start () {
    const p = (this.#polka = polka())
    staticFiles.reset()

    // static files for client
    p.use(staticFiles(config.clientPath, ['/art', '/api']))

      // Artwork
      .get('/art/:id', wrap(artwork))

      // API
      .use('/api', parseBody({ json: true }), getPlayer)

      // Status
      .get('/api/status', wrap(apiStatus))

      // Search
      .get('/api/search/:search', wrap(apiSearch))

      // Preset
      .post('/api/preset/:name', wrap(apiPreset))

      // Notify
      .post('/api/notify/:name', wrap(apiNotify))

      // Player
      .post('/api/player/:player/volume', wrap(apiPlayerVolume))
      .post('/api/player/:player/leader', wrap(apiPlayerLeader))
      .post('/api/player/:player/pause', wrap(apiPlayerPause))
      .post('/api/player/:player/play', wrap(apiPlayerPlay))
      .post('/api/player/:player/load', wrap(apiPlayerLoad))

    // start listening
    await new Promise((resolve, reject) => {
      p.listen(config.serverPort, '0.0.0.0', err => {
        if (err) return reject(err)
        this.#debug('Listening on port %d', config.serverPort)
        resolve(true)
      })
      p.server.on('error', reject)
    })
  }
}

export const server = Server.instance
