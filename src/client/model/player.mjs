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

      // derived
      isLeader: () => this.leaderName === '',
      leader: () => (this.isLeader ? this : this.model.byName[this.leaderName]),
      followers: () =>
        this.isLeader && this.players.filter(p => p.leader === this)
    })

    this.onUpdate(data)
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

  async getQueue () {
    if (!this.isLeader) return {}
    const url = `/api/player/${this.name}/queue`
    const result = await this.model.fetchData(url)
    const items = []
    for (const url of result?.items ?? []) {
      items.push(await this.library.fetchMedia(url))
    }

    return { ...result, items }
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

  play () {
    const url = `/api/player/${this.name}/play`
    return this.model.postCommand(url)
  }

  pause () {
    const url = `/api/player/${this.name}/pause`
    return this.model.postCommand(url)
  }
}
