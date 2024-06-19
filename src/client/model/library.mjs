import signalbox from '@ludlovian/signalbox'

export default class Library {
  #model
  untilFetched
  queue = []
  constructor (model) {
    this.#model = model

    signalbox(this, {
      // url to media object
      media: {},

      // url to now playing
      nowPlaying: {}
    })
  }

  get model () {
    return this.#model
  }

  onUpdate (data) {
    if (!data?.media?.now) return
    const { url, now } = data.media
    this.nowPlaying = { ...this.nowPlaying, [url]: now }
  }

  // gets the media for a URL. If we dont have it, we schedule
  // a fetch to go and get it.
  getMedia (url, nofetch) {
    const item = this.media[url]
    if (!item && !nofetch) {
      this.queue.push(url)
      this.untilFetched ??= this.#fetchQueue().catch(this.model.catch)
    }

    if (!item) return item
    // if we also have a nowPlaying, we should augment
    // the library data with that
    const now = this.nowPlaying[url]
    return now ? { ...item, now } : item
  }

  // proper async fetch of the media (if we don't have it)
  fetchMedia (url) {
    if (this.media[url]) return this.media[url]
    const fetchUrl = `/api/media/${encodeURIComponent(url)}`
    return this.model.fetchData(fetchUrl).then(item => {
      const data = { [item.url]: item }
      if (item.type === 'album') {
        let index = 0
        for (const track of item.tracks) {
          track.album = item
          track.index = index++
          data[track.url] = track
        }
      }
      this.media = { ...this.media, ...data }
      return this.media[url]
    })
  }

  async #fetchQueue () {
    let url
    while ((url = this.queue.shift())) {
      if (!this.media[url]) await this.fetchMedia(url)
    }
    this.untilFetched = undefined
  }
}
