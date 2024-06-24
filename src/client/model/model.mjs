import { batch } from '@preact/signals'
import { deserialize } from '@ludlovian/serialize-json'
import signalbox from '@ludlovian/signalbox'

import Player from './player.mjs'

const { fromEntries, entries } = Object

export default class Model {
  constructor () {
    this.catch = this.catch.bind(this)

    signalbox(this, {
      // system related data
      system: { players: {} },

      // the list of players
      players: [],

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
        this.system = {
          ...this.system,
          ...system
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
    const fetchUrl = '/api/search/' + encodeURIComponent(text)
    const { items } = await this.fetchData(fetchUrl)
    return items
  }

  #fetchAbout () {
    if (this.error) return
    if (this.isLoading || this.about) return
    this.fetchData('/api/about').then(data => (this.about = data))
  }
}
