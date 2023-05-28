import { signal, computed } from '@preact/signals-core'
import { SonosManager } from '@svrooij/sonos'
import Debug from 'debug'

import _retry from 'retry'

import Player from './player.mjs'

const retry = fn => _retry(fn, { retries: 3, delay: 100 })

class Network {
  static get instance () {
    if (Network._instance) return Network._instance
    Network._instance = new Network()
    return Network._instance
  }

  constructor () {
    this.debug = Debug('jonos:model:network')
    this.manager = null
    this.$players = signal([])
    this.$playerDetails = computed(() => this._playerDetails())
    this.$groups = computed(() => this._groups())
    this.$groupMembers = computed(() => this._groupMembers())
    this.$currentStatus = computed(() => this._currentStatus())
    this.$fullState = computed(() => this._fullState())
  }

  isStarted () {
    return !!this.manager
  }

  findPlayerById (id) {
    return this.$players.value.find(player => player.id === id)
  }

  _playerDetails () {
    const players = this.$players.value
    return Object.fromEntries(players.map(p => [p.id, p.deviceData]))
  }

  _groups () {
    const players = this.$players.value
    const groupLeaders = players.filter(p => p.isLeader())
    return groupLeaders.map(leader => ({
      leader,
      members: players.filter(p => p.follows(leader))
    }))
  }

  _groupMembers () {
    const groups = this.$groups.value
    return Object.fromEntries(
      groups.map(({ leader, members }) => [
        leader.id,
        members.map(m => m.id).sort()
      ])
    )
  }

  _currentStatus () {
    const players = this.$players.value
    return Object.fromEntries(players.map(p => [p.id, p.currentState]))
  }

  _fullState () {
    return {
      players: this.$playerDetails.value,
      groups: this.$groupMembers.value,
      status: this.$currentStatus.value
    }
  }

  async start () {
    if (this.manager) throw new Error('Started twice!')
    this.debug('Starting')
    this.manager = new SonosManager()
    await retry(() => this.manager.InitializeWithDiscovery())

    const allDevices = this.manager.Devices.filter(dev => dev.name !== 'BOOST')
    const players = await Promise.all(
      allDevices.map(device => retry(() => Player.fromDevice(device)))
    )
    players.forEach(player => player.subscribe())
    this.$players.value = players
    this.debug('Started')
  }

  stop () {
    const players = this.$players.value
    players.forEach(player => player.unsubscribe())
    this.manager.CancelSubscription()

    this.manager = null
    this.$players.value = []
    this.debug('stopped')
  }
}

const network = Network.instance
export { network }
