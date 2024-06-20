import { effect } from '@preact/signals'
import signalbox from '@ludlovian/signalbox'

export default class Player {
  #model

  constructor (model, data = {}) {
    this.#model = model

    signalbox(this, {
      // core data
      name: '',
      fullName: '',
      volume: 0,
      mute: false,
      leaderName: '',
      isPlaying: false,
      mediaUrl: undefined,
      queueUrls: undefined,

      // derived
      isLeader: () => this.leaderName === '',
      leader: () => (this.isLeader ? this : this.model.byName[this.leaderName]),
      followers: () =>
        this.isLeader && this.players.filter(p => p.leader === this),
      queue: () => this.#getQueue()
    })

    this.onUpdate(data)
    effect(() => this.#monitorQueue())
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
    }
    if (data.media) {
      this.mediaUrl = data.media.url
      this.library.onUpdate(data)
    }
  }

  // Reactive queue gathering
  #monitorQueue () {
    // If we are not playing, or have nothing loaded, then
    // empty out the queue
    if (!this.isLeader || !this.mediaUrl) {
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
    const { items } = await this.model.fetchData(url)
    // pre-fetch everything into the library
    for (const url of items) {
      await this.library.fetchMedia(url)
    }
    return items
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

  setVolume (volume) {
    const url = `/api/player/${this.name}/volume`
    const data = { volume }
    return this.model.postCommand(url, data)
  }

  setLeader (leader) {
    const url = `/api/player/${this.name}/leader`
    const data = { leader }
    return this.model.postCommand(url, data)
  }

  async load (urls, { add } = {}) {
    const repeat = true
    const url = `/api/player(${this.name}/load`
    const data = { urls, opts: { add, repeat } }
    await this.model.postCommand(url, data)
    this.queueUrls = add ? [...this.queueUrls, ...urls] : [...urls]
  }

  play () {
    const url = `/api/player/${this.name}/play`
    return this.model.postCommand(url)
  }

  pause () {
    const url = `/api/player/${this.name}/pause`
    return this.model.postCommand(url)
  }
}
