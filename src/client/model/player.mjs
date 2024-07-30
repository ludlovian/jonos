import { effect } from '@preact/signals'
import signalbox from '@ludlovian/signalbox'
import Bouncer from '@ludlovian/bouncer'
import sortBy from '@ludlovian/sortby'
import { CIFS } from '@ludlovian/jonos-api/constants'

import config from '../config.mjs'

export default class Player {
  parent
  prev = { volume: undefined }

  constructor (parent) {
    this.parent = parent

    signalbox(this, {
      // core data
      id: undefined,
      name: '',
      uuid: undefined,
      fullName: '',
      url: '',
      model: '',
      leaderName: '',
      volume: undefined,
      mute: undefined,
      playing: undefined,
      media: undefined,
      queue: undefined,
      nowStream: undefined,

      // derived
      isLoading: () => !this.leaderName,
      leader: () => this.parent.byName[this.leaderName],
      isLeader: () => this.leader === this,
      followers: () => {
        if (!this.isLeader) return null
        const members = this.parent.groups.get(this)
        return members.filter(p => p !== this).sort(sortBy('fullName'))
      },
      members: () => (this.isLeader ? [this, ...this.followers] : null),
      hasQueue: () => !!this.queue,
      groupedQueue: () => this.#groupedQueue()
    })

    this.volumeBouncer = new Bouncer({
      after: config.volumeThrottle,
      fn: () => this.#updateVolume()
    })

    effect(() => this.volumeBouncer.fire(this.volume))
  }

  #groupedQueue () {
    if (!this.hasQueue || !this.queue.length) return null
    const groups = []

    let tracks = []
    let media = this.queue[0]
    let isCurrent = false
    for (const item of this.queue) {
      if (item.albumId !== media.albumId) {
        groups.push({ media, isCurrent, tracks })
        tracks = []
        media = item
        isCurrent = false
      }
      tracks.push(item)
      if (item.id === this.media.id) {
        isCurrent = true
        media = item
      }
    }
    groups.push({ media, isCurrent, tracks })
    return groups
  }

  #updateVolume () {
    if (this.parent.error) return
    if (this.volume === this.prev.volume) return
    const url = `/api/player/${this.name}/volume`
    const data = { volume: this.volume }
    this.prev.volume = this.volume
    this.parent.postCommand(url, data)
  }

  async setLeader (leaderName) {
    if (leaderName === this.leaderName) return
    const url = `/api/player/${this.name}/leader`
    const data = { leader: leaderName }
    await this.parent.postCommand(url, data)
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
    await this.parent.postCommand(commandUrl, data)
  }

  play () {
    const url = `/api/player/${this.name}/play`
    return this.parent.postCommand(url)
  }

  pause () {
    const url = `/api/player/${this.name}/pause`
    return this.parent.postCommand(url)
  }
}
