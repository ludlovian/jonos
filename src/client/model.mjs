import { batch } from '@preact/signals'

import Parsley from 'parsley'
import sortBy from 'sortby'

import { addSignals } from './signal-extra.mjs'

window.Parsley = Parsley
const { fromEntries, entries } = Object

class Model {
  constructor () {
    addSignals(this, {
      // from server
      players: [],

      // local
      error: undefined,

      //derived
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
        ),
      query: () => this._query(window.location.search.slice(1)),
      isTest: () => this.query.test != null
    })
  }

  _query (qs) {
    return fromEntries(
      qs
        .split('&')
        .filter(Boolean)
        .map(kv => {
          const [k, v] = kv.split('=')
          return [k, val(v)]
        })
    )

    function val (x) {
      if (x === undefined) return true
      if (!x) return ''
      x = decodeURIComponent(x)
      if (x === 'true') return true
      if (x === 'false') return false
      return +x * 0 === 0 ? +x : x
    }
  }

  _onData (update) {
    batch(() => {
      for (const [name, data] of entries(update)) {
        let player = this.byName[name]
        if (!player) {
          player = new Player()
          player.name = name
          this.players = [...this.players, player].sort(sortBy('name'))
        }
        player._onData(data)
      }
    })
  }

  start (url) {
    this._subscribe(url)
  }

  _subscribe (url) {
    const es = new window.EventSource(url)
    es.onmessage = ({ data }) => this._onData(JSON.parse(data))
    if (this.query.stop) {
      setTimeout(() => es.close(), 5000)
    }
  }

  _writeToLocalStorage () {
    window.localStorage.setItem('players', JSON.stringify(this.state))
  }

  _loadFromLocalStorage () {
    const data = window.localStorage.getItem('players')
    if (!data) return
    this._onData(JSON.parse(data))
  }

  static get instance () {
    return (this._instance = this._instance || new Model())
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
      state: () => {
        const { name, fullName, leader, volume, mute, playState } = this
        return { name, fullName, leader, volume, mute, playState }
      },
      isLeader: () => this.leader === this.name,
      isPlaying: () =>
        this.isLeader && ['PLAYING', 'TRANSITIONING'].includes(this.playState)
    })
  }

  _trackTitle () {
    let t = ''
    if (!this.trackMetadata) return t
    const p = Parsley.from(this.trackMetadata, { safe: true })
    if (!p) return t
    let e = p.find('r:streamContent')
    if (!e) return t
    t = e.text
    if (t) return t
    e = p.find('dc:title')
    if (!e) return t
    t = e.text
    return t != null ? t : ''
  }

  _onData (data) {
    batch(() => {
      for (const [k, v] of entries(data)) {
        if (k in this) this[k] = v
      }
    })
  }

  follows (other) {
    return this.leader === other.name
  }
}

const model = Model.instance
window.model = model
export default model
