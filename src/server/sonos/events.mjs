import Debug from '@ludlovian/debug'
import Timer from 'timer'

import { parseEvent } from './parse.mjs'
import {
  subscribe as sonosSubscribe,
  unsubscribe as sonosUnsubscribe
} from './call.mjs'
import {
  serverIP,
  serverPort,
  sonosSubscriptionTimeout,
  sonosSubscriptionRenewal
} from '../config.mjs'

const SERVICES = [
  ['AVTransport', 'MediaRenderer/AVTransport'],
  ['RenderingControl', 'MediaRenderer/RenderingControl'],
  ['ZoneGroupTopology', 'ZoneGroupTopology', true]
]

class Subscription {
  constructor (player) {
    this.services = []
    for (const [service, path, keystoneOnly] of SERVICES) {
      if (!keystoneOnly || player.keystone) {
        this.services.push(new ServiceSubscription(player, service, path))
      }
    }
  }

  start () {
    return Promise.all(this.services.map(s => s.start()))
  }

  stop () {
    return Promise.all(this.services.map(s => s.stop()))
  }

  reset () {
    this.services.forEach(s => s.reset())
  }
}

class ServiceSubscription {
  debug = Debug('jonos:sonos')
  sid = null
  tm = new Timer()

  constructor (player, service, path) {
    Object.assign(this, { player, service, path })
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
    this.sid = await sonosSubscribe(this.player.address, this.path, headers)
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
    this.sid = await sonosSubscribe(this.player.address, this.path, headers)
    this.debug('%s renewed %s', this.player.name, this.service)
    this.tm.set({
      after: sonosSubscriptionRenewal,
      fn: () => this.renew()
    })
  }

  async stop () {
    if (this.sid == null) return null
    this.tm.cancel()
    const headers = { sid: this.sid }
    await sonosUnsubscribe(this.player.address, this.path, headers)
    this.debug('%s unsubscribed from %s', this.player.name, this.service)
  }

  reset () {
    this.tm.cancel()
    this.sid = null
  }
}

export function subscribe (player) {
  return new Subscription(player)
}

export async function handleEvent (req, res) {
  if (req.method !== 'NOTIFY' || !req.player) {
    return res.writeHead(404).end()
  }
  const { service } = req.params
  if (req.body) {
    res.writeHead(200).end()
    const data = parseEvent(service, req.body)
    if (data) req.player.onData(data)
  } else {
    console.error('Empty notify event: %o', req)
  }
}
