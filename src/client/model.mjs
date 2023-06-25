import { batch } from '@preact/signals'
import { deserialize } from 'pixutil/json'
import Parsley from 'parsley'
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
      groups: () =>
        fromEntries(
          this.players
            .filter(p => p.isLeader)
            .map(l => [
              l.name,
              this.players.filter(p => p.follows(l)).map(p => p.name)
            ])
        )
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
            const player = new Player()
            assign(player, data)
            this.players = [...this.players, player].sort(sortBy('name'))
          } else {
            assign(player, data)
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
  constructor () {
    addSignals(this, {
      name: '',
      fullName: '',
      leader: '',
      volume: 0,
      mute: false,
      playState: '',
      trackURI: '',
      trackMetadata: '',
      trackTitle: () => this._trackTitle(),
      isLeader: () => this.leader === this.name,
      isPlaying: () =>
        this.isLeader && ['PLAYING', 'TRANSITIONING'].includes(this.playState)
    })
  }

  _trackTitle () {
    if (!this.trackMetadata) return ''
    const p = Parsley.from(this.trackMetadata, { safe: true })
    return p?.find('r:streamContent')?.text ?? p?.find('dc:title')?.text ?? ''
  }

  follows (other) {
    return this.leader === other.name
  }
}

const model = new Model()
window.model = model
export default model
