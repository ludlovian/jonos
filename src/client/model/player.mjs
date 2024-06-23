import { effect } from '@preact/signals'
import signalbox from '@ludlovian/signalbox'
import Bouncer from '@ludlovian/bouncer'
import { CIFS } from '@ludlovian/jonos-api/constants'

import { isValidUrl } from '../valid.mjs'
import config from '../config.mjs'

export default class Player {
  #model
  #prev = { volume: undefined }

  constructor (model, data = {}) {
    this.#model = model

    signalbox(this, {
      // core data
      name: '',
      fullName: '',
      volume: undefined,
      mute: undefined,
      leaderName: undefined,
      isPlaying: undefined,
      mediaUrl: undefined,
      queueUrls: undefined,

      // derived
      leader: () => this.model.byName[this.leaderName],
      isLeader: () => this.leader === this,
      followers: () =>
        this.isLeader && this.players.filter(p => p.leader === this),
      queue: () => this.#getQueue()
    })

    this.volumeBouncer = new Bouncer({
      after: config.volumeThrottle,
      fn: () => this.#updateVolume()
    })

    this.onUpdate(data)
    effect(() => this.#monitorQueue())
    effect(() => this.volumeBouncer.fire(this.volume))
  }

  get model () {
    return this.#model
  }

  get players () {
    return this.model.players
  }

  get library () {
    return this.model.library
  }

  onUpdate (data) {
    for (const [key, val] of Object.entries(data)) {
      if (key in this) this[key] = val
      if (key in this.#prev) this.#prev[key] = val
    }
    if (data.media) {
      this.mediaUrl = data.media.url
      this.library.onUpdate(data)
    }
  }

  // Reactive queue gathering
  #monitorQueue () {
    if (this.model.error) return
    // The only queues we monitor are those we know about
    if (!this.isLeader || !isValidUrl(this.mediaUrl)) {
      this.queueUrls = undefined
      return
    }

    // If we have a queue, and the new url is on it then leave
    // well alone
    if (this.queueUrls) {
      if (this.queueUrls.some(url => url === this.mediaUrl)) return
    }

    // Now we must fetch the playlsit from the server
    const mediaUri = this.mediaUri
    this.#fetchQueue()
      .then(urls => {
        if (this.mediaUri !== mediaUri) return // somehting changed
        this.queueUrls = urls
      })
      .catch(this.model.catch)
  }

  async #fetchQueue () {
    // fetch the queue, wich pre-fetches the albums if any are
    // tracks
    const url = `/api/player/${this.name}/queue`
    const { items: urls } = await this.model.fetchData(url)
    // pre-fetch everything into the library
    for (const url of urls) {
      await this.library.fetchMedia(url)
    }
    return urls
  }

  #getQueue () {
    // turns the current list of URLs into a structured
    // list of media items. In particular it:
    //
    // - gets the cached library item for each url
    // - for tracks, it aggregates them into (subsets) of albums
    // - for radio, it enhances the data with any `now playing`

    if (!this.queueUrls) return undefined
    const queue = []
    let album
    for (const url of this.queueUrls) {
      const item = this.library.media[url]
      if (!item) throw new Error('Bad library url:' + url)
      if (item.type === 'track') {
        if (item.album.url !== album?.url) {
          album = { ...item.album, tracks: [item] }
          queue.push(album)
        } else {
          album.tracks.push(item)
        }
      } else if (item.type === 'radio') {
        const now = this.library.nowPlaying[url]
        queue.push({ ...item, now })
      } else {
        queue.push(item)
      }
    }
    return queue
  }

  #updateVolume () {
    if (this.model.error) return
    if (this.volume === this.#prev.volume) return
    const url = `/api/player/${this.name}/volume`
    const data = { volume: this.volume }
    this.#prev.volume = this.volume
    this.model.postCommand(url, data)
  }

  async setLeader (leaderName) {
    if (leaderName === this.leaderName) return
    const url = `/api/player/${this.name}/leader`
    const data = { leader: leaderName }
    await this.model.postCommand(url, data)
    this.leaderName = leaderName
  }

  async load (urls, opts = {}) {
    const commandUrl = `/api/player/${this.name}/load`
    // reset repeat and add unless all tracks are tracks
    if (!urls.every(url => url.startsWith(CIFS))) {
      delete opts.repeat
      delete opts.add
    }
    const data = { urls, opts }
    await this.model.postCommand(commandUrl, data)
    this.queueUrls = opts.add ? [...this.queueUrls, ...urls] : [...urls]
  }

  play () {
    const url = `/api/player/${this.name}/play`
    return this.model.postCommand(url)
  }

  pause () {
    const url = `/api/player/${this.name}/pause`
    return this.model.postCommand(url)
  }

  preset (volumes) {
    const url = `/api/player/${this.name}/preset`
    const data = { volumes }
    return this.model.postCommand(url, data)
  }

  notify (url, opts) {
    const commandUrl = `/api/player/${this.name}/notify`
    const data = { url, opts }
    return this.model.postCommand(commandUrl, data)
  }
}
