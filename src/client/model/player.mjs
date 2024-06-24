import { effect } from '@preact/signals'
import signalbox from '@ludlovian/signalbox'
import Bouncer from '@ludlovian/bouncer'
import { CIFS } from '@ludlovian/jonos-api/constants'

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
      trackUrl: undefined,
      queue: undefined,
      media: undefined,

      // derived
      leader: () => this.model.byName[this.leaderName],
      isLeader: () => this.leader === this,
      followers: () =>
        this.isLeader && this.players.filter(p => p.leader === this)
    })

    this.volumeBouncer = new Bouncer({
      after: config.volumeThrottle,
      fn: () => this.#updateVolume()
    })

    this.onUpdate(data)
    effect(() => this.volumeBouncer.fire(this.volume))
  }

  get model () {
    return this.#model
  }

  get players () {
    return this.model.players
  }

  onUpdate (data) {
    for (const [key, val] of Object.entries(data)) {
      if (key in this) this[key] = val
      if (key in this.#prev) this.#prev[key] = val
    }
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

  async load (url, opts = {}) {
    const commandUrl = `/api/player/${this.name}/load`
    // reset repeat and add unless all tracks are tracks
    if (!url.startsWith(CIFS)) {
      delete opts.repeat
      delete opts.add
    }
    const data = { url, opts }
    await this.model.postCommand(commandUrl, data)
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
