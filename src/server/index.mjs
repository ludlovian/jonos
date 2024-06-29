import polka from 'polka'
import Debug from '@ludlovian/debug'
import { config as globalConfig } from '@ludlovian/configure'

import { staticFiles, parseBody, log, wrap, getPlayer } from './wares.mjs'

import config from './config.mjs'
import {
  apiStatus,
  apiStatusUpdates,
  apiPlayerVolume,
  apiPlayerLeader,
  apiPlayerPlay,
  apiPlayerPause,
  apiPlayerLoad,
  apiPlayerPreset,
  apiPlayerNotifcation,
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
    staticFiles.reset()

    const p = (this.#polka = polka())

    // static files for client
    p.use(staticFiles(config.clientPath, ['/art', '/api']))

      // Artwork
      .get('/art/:url', wrap(artwork))

      // API
      .use('/api', log, parseBody({ json: true }), getPlayer)

      // Status
      .get('/api/status/updates', wrap(apiStatusUpdates))
      .get('/api/status', wrap(apiStatus))

      // Search
      .get('/api/search/:search', wrap(apiSearch))

      // Player
      .post('/api/player/:name/volume', wrap(apiPlayerVolume))
      .post('/api/player/:name/leader', wrap(apiPlayerLeader))
      .post('/api/player/:name/pause', wrap(apiPlayerPause))
      .post('/api/player/:name/play', wrap(apiPlayerPlay))
      .post('/api/player/:name/load', wrap(apiPlayerLoad))
      .post('/api/player/:name/preset', wrap(apiPlayerPreset))
      .post('/api/player/:name/notify', wrap(apiPlayerNotifcation))

    // start listening
    await new Promise((resolve, reject) => {
      p.listen(config.serverPort, '0.0.0.0', err => {
        if (err) return reject(err)
        this.#debug('Listening on port %d', config.serverPort)
        resolve(true)
      })
      p.server.on('error', reject)
    })

    staticFiles.preloadCovers(globalConfig.jonosModelLibraryRoot)
  }
}

export const server = Server.instance
