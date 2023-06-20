import { send } from 'httpie'
import Debug from '@ludlovian/debug'

import Timer from 'timer'

import { parseEvent } from './parse.mjs'
import {
  serverIP,
  serverPort,
  sonosSubscriptionTimeout,
  sonosSubscriptionRenewal
} from '../config.mjs'

class SubscriptionManager {
  services = [
    ['AVTransport', 'MediaRenderer/AVTransport'],
    ['RenderingControl', 'MediaRenderer/RenderingControl'],
    ['ZoneGroupTopology', 'ZoneGroupTopology', true]
  ]

  subscriptions = {}
  debug = Debug('jonos:sonos')

  static get instance () {
    return (this._instance = this._instance || new SubscriptionManager())
  }

  get address () {
    return `http://${this.serverIP}:${this.port}`
  }

  reset () {
    this.subscriptions = {}
  }

  async unsubscribeAll () {
    for (const name of Object.keys(this.subscriptions)) {
      await this.unsubscribe({ name })
    }
  }

  async handleEvent (req, res) {
    if (req.method !== 'NOTIFY') {
      return res.writeHead(404).end()
    }
    const { name, service } = req.params
    const subs = this.subscriptions[name] || {}
    const sub = subs[service]
    if (!sub) return res.writeHead(404).end()

    if (req.body) {
      res.writeHead(200).end()
      const data = parseEvent(service, req.body)
      if (data) sub.player.onData(data)
    } else {
      console.error('Empty notify event: %o', req)
    }
  }

  async subscribe (player) {
    if (this.subscriptions[player.name]) return

    const subs = (this.subscriptions[player.name] = {})

    for (const srv of this.services) {
      const [service, path, global] = srv
      if (global && !player.keystone) continue

      const sub = new Subscription({
        debug: this.debug,
        player,
        service,
        path
      })
      subs[service] = sub

      await sub.start()
    }
  }

  async unsubscribe ({ name }) {
    const subs = this.subscriptions[name]
    if (!subs) return
    this.subscriptions[name] = undefined

    for (const sub of Object.values(subs)) {
      await sub.stop()
    }
  }
}

class Subscription {
  sid = null
  tm = new Timer()

  constructor (props) {
    Object.assign(this, props)
  }

  get playerAddress () {
    return `http://${this.player.address}:1400/${this.path}/Event`
  }

  get callbackAddress () {
    return `http://${serverIP}:${serverPort}/notify/${this.player.name}/${this.service}`
  }

  async start () {
    const headers = {
      callback: `<${this.callbackAddress}>`,
      NT: 'upnp:event',
      Timeout: sonosSubscriptionTimeout
    }
    const res = await send('SUBSCRIBE', this.playerAddress, { headers })
    this.sid = res.headers.sid
    this.debug('%s subscribed to %s', this.player.name, this.service)
    this.tm.set({
      after: sonosSubscriptionRenewal,
      fn: () => this.renew()
    })
  }

  async renew () {
    const headers = {
      sid: this.sid,
      Timeout: sonosSubscriptionTimeout
    }
    const res = await send('SUBSCRIBE', this.playerAddress, { headers })
    this.sid = res.headers.sid
    this.debug('%s renewed %s', this.player.name, this.service)
    this.tm.set({
      after: sonosSubscriptionRenewal,
      fn: () => this.renew()
    })
  }

  async stop () {
    this.tm.cancel()
    const headers = { sid: this.sid }
    await send('UNSUBSCRIBE', this.playerAddress, { headers })
    this.debug('%s unsubscribed from %s', this.player.name, this.service)
  }
}

const manager = SubscriptionManager.instance

export const handleEvent = manager.handleEvent.bind(manager)

export function unsubscribeAll () {
  return manager.unsubscribeAll()
}

export function subscribe (player) {
  return manager.subscribe(player)
}

export function reset () {
  return manager.reset()
}
