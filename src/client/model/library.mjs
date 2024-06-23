import signalbox from '@ludlovian/signalbox'
import { isValidUrl } from '../valid.mjs'

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
  async fetchMedia (url) {
    if (this.media[url]) return this.media[url]

    // If nothing else, we will store these
    const newItem = { url }
    const newData = { [url]: newItem }

    if (isValidUrl(url)) {
      const fetchUrl = `/api/media/${encodeURIComponent(url)}`
      const item = await this.model.fetchData(fetchUrl)
      Object.assign(newItem, item)

      if (item.type === 'album') {
        let index = 0
        for (const track of item.tracks) {
          track.album = item
          track.index = index++
          newData[track.url] = track
        }
      }
    }
    this.media = { ...this.media, ...newData }
  }
}
