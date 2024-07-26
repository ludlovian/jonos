import { batch } from '@preact/signals'
import tinydate from 'tinydate'
import { deserialize } from '@ludlovian/serialize-json'
import signalbox from '@ludlovian/signalbox'
import sortBy from '@ludlovian/sortby'
import Player from './player.mjs'

const { fromEntries, entries } = Object
const fmtDate = tinydate('{DDD} {MMM} {D} {HH}:{mm}', {
  D: d => d.getDate(),
  MMM: d => d.toLocaleString('default', { month: 'short' }),
  DDD: d => d.toLocaleString('default', { weekday: 'short' })
})

export default class Model {
  constructor () {
    this.catch = this.catch.bind(this)
    this.system = {}

    signalbox(this.system, {
      version: undefined,
      started: undefined,
      listening: 0,
      players: {},
      notifies: {},
      presets: {},

      startTime: () => fmtDate(new Date(this.system.started))
    })

    signalbox(this, {
      // the list of players
      players: [],

      // local
      error: undefined,

      // derived
      byName: () => fromEntries(this.players.map(p => [p.name, p])),
      isLoading: () => this.players.length === 0,
      groups: () => Map.groupBy(this.players, p => this.byName[p.leaderName]),
      leaders: () =>
        this.players
          .filter(p => p.isLeader)
          .sort(sortBy('playing', 'desc').thenBy('fullName'))
    })
  }

  catch (err) {
    console.error(err)
    this.error = err
  }

  onUpdate (update) {
    batch(() => {
      if ('system' in update) {
        for (const k in update.system) {
          this.system[k] = update.system[k]
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
    this.source.onmessage = ({ data }) => this.onUpdate(JSON.parse(data))
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
    const isValid =
      text &&
      text
        .trim()
        .split(/ +/)
        .filter(x => x.length > 2).length
    if (!isValid) return []
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
