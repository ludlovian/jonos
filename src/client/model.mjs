import { batch } from '@preact/signals'
import { deserialize } from 'pixutil/json'
import sortBy from 'sortby'
import addSignals from '@ludlovian/signal-extra/add-signals'

const { fromEntries, entries, assign } = Object

class Model {
  constructor () {
    addSignals(this, {
      // from server
      version: '',
      started: '',
      isDev: false,
      players: [],

      // local
      error: undefined,

      // derived
      byName: () => fromEntries(this.players.map(p => [p.name, p])),
      state: () => fromEntries(this.players.map(p => [p.name, p.state])),
      isLoading: () => this.players.length === 0,
      leaders: () => this.players.filter(p => p.isLeader),
      groups: () =>
        this.leaders.map(leader => [
          leader,
          this.players.filter(p => p.follows(leader))
        ])
    })
  }

  _onData (update) {
    batch(() => {
      if ('server' in update) {
        assign(this, update.server)
      }

      if ('players' in update) {
        for (const [name, data] of entries(update.players)) {
          const player = this.byName[name]
          if (!player) {
            const player = new Player(this, data)
            this.players = [...this.players, player].sort(sortBy('name'))
          } else {
            player._onData(data)
          }
        }
      }
    })
  }

  start (url) {
    this._subscribe(url)
  }

  _subscribe (url) {
    this.source = new window.EventSource(url)
    this.source.onmessage = ({ data }) =>
      this._onData(deserialize(JSON.parse(data)))
  }
}

class Player {
  constructor (players, data = {}) {
    this.players = players

    addSignals(this, {
      // core data
      name: '',
      fullName: '',
      leaderName: '',
      volume: 0,
      mute: false,
      playState: '',
      trackDetails: [],

      // derived
      leader: () => this.players.byName[this.leaderName] || this,
      isLeader: () => this.leader === this,
      isPlaying: () =>
        this.isLeader && ['PLAYING', 'TRANSITIONING'].includes(this.playState)
    })

    this._onData(data)
  }

  _onData (data) {
    for (const [key, val] of entries(data)) {
      if (key in this) this[key] = val
    }
  }

  follows (other) {
    return this.leader === other
  }
}

const model = new Model()
window.model = model
export default model
