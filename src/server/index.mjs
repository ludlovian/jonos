import polka from 'polka'
import Debug from 'debug'

import { staticFiles, parseBody, log, wrap } from './wares.mjs'
import {
  statusUpdates,
  groupMembers,
  groupVolume,
  groupNotify
} from './handlers.mjs'

class Server {
  static get instance () {
    if (this._instance) return this._instance
    this._instance = new Server()
    return this._instance
  }

  constructor () {
    this.debug = Debug('jonos:server')
  }

  start (opts = {}) {
    const { port = 3500 } = opts
    const p = (this.polka = polka())

    // middleware
    p.use(staticFiles, parseBody, log)

      // routes
      .get('/status/updates', wrap(statusUpdates))

      .post('/group/members/:leader', wrap(groupMembers))
      .post('/group/volume', wrap(groupVolume))
      .post('/group/notify/:leader', wrap(groupNotify))

    // start listening
    return new Promise((resolve, reject) => {
      p.listen(port, err => {
        if (err) return reject(err)
        this.debug('Listening on port %d', port)
        resolve(true)
      })
    })
  }
}

const server = Server.instance

export { server }
