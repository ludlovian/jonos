import signalbox from '@ludlovian/signalbox'

export default class Library {
  #model

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
}
