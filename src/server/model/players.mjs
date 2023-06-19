import { batch } from '@preact/signals-core'
import Debug from 'debug'

import sortBy from 'sortby'

import { addSignals } from './signal-extra.mjs'
import Player from './player.mjs'
import {
  getZoneGroupState,
  subscribe as sonosSubscribe,
  unsubscribeAll as sonosUnsubscribeAll,
  reset as sonosReset
} from '../sonos/index.mjs'
import { isDev } from '../config.mjs'

const fromEntries = Object.fromEntries.bind(Object)

class Players {
  keystone = '192.168.86.210'

  static get instance () {
    return (this._instance = this._instance || new Players())
  }

  debug = Debug('jonos:model')

  constructor () {
    addSignals(this, {
      players: [],
      names: () => this.players.map(p => p.name).sort(),
      byName: () => fromEntries(this.players.map(p => [p.name, p])),
      byUuid: () => fromEntries(this.players.map(p => [p.uuid, p])),
      state: () => Object.fromEntries(this.players.map(p => [p.name, p.state]))
    })
  }

  async start () {
    await this.reloadFromKeystone()
  }

  async restart () {
    sonosReset()
    this.players = []
    await this.start()
  }

  async reloadFromKeystone () {
    const address = this.keystone
    const { zones } = await getZoneGroupState({ address })
    await this.setZones(zones)
  }

  setZones (playerDetails) {
    const proms = []
    batch(() => {
      if (playerDetails.length < this.players.length) {
        // A Sonos player has disappeared (probably the Roam)
        // Rather than trying to cope gracefully, we simply reset
        // the subscriptions and start from scratch
        this.debug('Resetting all players')
        sonosReset()
        this.players = []
      }

      for (const p of playerDetails) {
        let player = this.byName[p.name]
        if (!player) {
          player = new Player(this)
          this.players = [...this.players, player].sort(sortBy('name'))
          this.debug('Player %s added', p.name)
          Object.assign(player, p)
          proms.push(player.getDescription())
        }
        Object.assign(player, p)
        if (p.address === this.keystone) player.keystone = true
      }
    })
    return Promise.all(proms)
  }

  onData (data) {
    if (data && data.zones) {
      this.debug('Zones updated')
      this.setZones(data.zones)
    }
  }

  async subscribeAll () {
    for (const player of this.players) {
      await sonosSubscribe(player)
    }
  }

  async unsubscribeAll () {
    await sonosUnsubscribeAll()
  }
}

const players = Players.instance
if (isDev) global.players = players
export default players
