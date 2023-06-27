import { batch } from '@preact/signals-core'
import Debug from '@ludlovian/debug'
import sortBy from 'sortby'
import addSignals from '@ludlovian/signal-extra/add-signals'

import Player from './player.mjs'
import { getZoneGroupState } from '../sonos/index.mjs'

const fromEntries = Object.fromEntries.bind(Object)

export default class Players {
  keystone = '192.168.86.210'

  static get instance () {
    return (this._instance = this._instance || new Players())
  }

  debug = Debug('jonos:model')

  constructor () {
    addSignals(this, {
      // core
      players: [],

      // derived
      names: () => this.players.map(p => p.name).sort(),
      byName: () => fromEntries(this.players.map(p => [p.name, p])),
      byUuid: () => fromEntries(this.players.map(p => [p.uuid, p])),
      state: () => Object.fromEntries(this.players.map(p => [p.name, p.state])),
      isSubscribed: () => this.players.every(p => p.isSubscribed),
      groups: () =>
        fromEntries(
          this.players
            .filter(p => p.isLeader)
            .map(l => [
              l.name,
              this.players.filter(p => p.leader === l).map(p => p.name)
            ])
        )
    })
  }

  async start () {
    await this.reloadFromKeystone()
  }

  async subscribe () {
    if (this.isSubscribed) return null
    await Promise.all(this.players.map(p => p.subscribe()))
  }

  async unsubscribe () {
    await Promise.all(this.players.map(p => p.unsubscribe()))
  }

  async reset () {
    this.debug('Resetting all players')
    this.players.forEach(p => p.reset())
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
        return this.reset()
      }

      for (const p of playerDetails) {
        if (p.address === this.keystone) p.keystone = true
        if (p.name in this.byName) {
          Object.assign(this.byName[p.name], p)
        } else {
          const player = Object.assign(new Player(this), p)
          this.players = [...this.players, player].sort(sortBy('name'))
          this.debug('Player %s added', p.name)
          proms.push(player.update())
        }
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
}
