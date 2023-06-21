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

  subscriptions = new Map()
  debug = Debug('jonos:sonos')

  get address () {
    return `http://${this.serverIP}:${this.port}`
  }

  reset () {
    for (const subs of this.subscriptions.values()) {
      for (const sub of subs.values()) {
        sub.tm.cancel()
      }
    }
    this.subscriptions.clear()
  }

  async unsubscribeAll () {
    for (const name of this.subscriptions.keys()) {
      await this.unsubscribe({ name })
    }
  }

  async handleEvent (req, res) {
    if (req.method !== 'NOTIFY') {
      return res.writeHead(404).end()
    }
    const { name, service } = req.params
    const sub = this.subscriptions.get(name)?.get(service)
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
    const { name, keystone } = player
    if (this.subscriptions.has(name)) return
    const subs = new Map()
    this.subscriptions.set(name, subs)

    for (const srv of this.services) {
      const [service, path, global] = srv
      if (global && !keystone) continue

      const sub = new Subscription({ player, service, path })
      subs.set(service, sub)
      await sub.start()
    }
  }

  async unsubscribe ({ name }) {
    if (!this.subscriptions.has(name)) return

    for (const sub of this.subscriptions.get(name).values()) {
      await sub.stop()
    }
    this.subscriptions.delete(name)
  }
}

class Subscription {
  debug = Debug('jonos:sonos')
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

const manager = new SubscriptionManager()
export const handleEvent = manager.handleEvent.bind(manager)
export const unsubscribeAll = manager.unsubscribeAll.bind(manager)
export const subscribe = manager.subscribe.bind(manager)
export const reset = manager.reset.bind(manager)
