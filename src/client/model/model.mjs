import { batch } from '@preact/signals'
import { deserialize } from '@ludlovian/serialize-json'
import signalbox from '@ludlovian/signalbox'

import Library from './library.mjs'
import Player from './player.mjs'
import Router from './router.mjs'

const { fromEntries, entries } = Object

export default class Model {
  constructor () {
    this.library = new Library(this)
    this.router = new Router(this)
    this.catch = this.catch.bind(this)

    signalbox(this, {
      // from server
      version: '',
      started: '',
      isDev: false,
      players: [],

      // the 'now playing' bit for streaming media
      nowPlaying: {},
      // cached media to save looking up
      media: {},

      // local
      error: undefined,

      // derived
      byName: () => fromEntries(this.players.map(p => [p.name, p])),
      isLoading: () => this.players.length === 0,
      groups: () => Map.groupBy(this.players, p => p.leader)
    })
  }

  catch (err) {
    console.error(err)
    this.error = err
  }

  onUpdate (update) {
    batch(() => {
      if ('system' in update) {
        const { system } = update
        for (const key in system) {
          if (key in this) this[key] = update
        }
      }

      if ('players' in update) {
        const { players } = update
        for (const [name, data] of entries(players)) {
          let player = this.byName[name]
          if (!player) {
            player = new Player(this, { name })
            this.players = [...this.players, player]
          }
          player.onUpdate(data)
        }
      }
    })
  }

  start (url) {
    this.source = new window.EventSource(url)
    this.source.onmessage = ({ data }) =>
      this.onUpdate(deserialize(JSON.parse(data), { date: true }))
  }

  fetchData (url) {
    return window
      .fetch(url)
      .then(async res => {
        if (!res.ok) throw new Error(res.statusMessage)
        return deserialize(await res.json(), { date: true })
      })
      .catch(this.catch)
  }

  postCommand (url, data) {
    const opts = { method: 'POST' }
    if (data) opts.body = JSON.stringify(data)
    return window
      .fetch(url, opts)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
      })
      .catch(this.catch)
  }

  async search (text) {
    if (!text || text.length < 3) return []
    const url = '/api/search/' + encodeURIComponent(text)
    return this.fetchData(url)
  }
}
