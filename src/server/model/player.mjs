import { effect, batch } from '@preact/signals-core'
import Debug from 'debug'

import { notificationTimeout } from '../config.mjs'
import { addSignals, once } from './signal-extra.mjs'
import {
  getDeviceDescription,
  getMediaInfo,
  getPositionInfo,
  setAVTransportURI,
  seekTrack,
  seekPos,
  pause,
  play,
  setVolume,
  setMute,
  joinGroup,
  startOwnGroup
} from '../sonos/index.mjs'

export default class Player {
  constructor (players) {
    this._players = players

    addSignals(this, {
      // static
      name: '',
      keystone: false,
      address: '',
      fullName: '',
      uuid: '',
      model: '',
      // variable
      leaderUuid: '',
      volume: undefined,
      mute: false,
      playState: undefined,
      trackURI: '',
      trackMetadata: '',
      // derived
      state: this._state.bind(this),
      isLeader: () => !this.leaderUuid,
      leader: () =>
        this.isLeader ? this : this._players.byUuid[this.leaderUuid],
      isPlaying: () => this.isLeader && isPlaying(this.playState)
    })

    effect(() => {
      this.debug = Debug(`jonos:player:${this.name}`)
    })
  }

  _state () {
    return {
      name: this.name,
      fullName: this.fullName,
      leader: this.leader.name,
      playState: this.isLeader ? this.playState : '',
      trackURI: this.isLeader ? this.trackURI : '',
      trackMetadata: this.isLeader ? this.trackMetadata : '',
      volume: this.volume,
      mute: this.mute
    }
  }

  async getDescription () {
    if (this.model) return
    const data = await getDeviceDescription(this)
    this.onData(data)
  }

  onData (data) {
    if (!data) return
    batch(() => {
      for (const [k, v] of Object.entries(data)) {
        if (k in this) {
          this.debug('Updated %s', k)
          this[k] = v
        }
      }
      if (this.keystone) this._players.onData(data)
    })
  }

  setVolume (vol) {
    this.debug('setVolume: %d', vol)
    this.volume = vol
    return setVolume(this, vol)
  }

  setMute (mute) {
    this.debug('setMute: %o', mute)
    this.mute = mute
    return setMute(this, mute)
  }

  setLeader (name) {
    this.debug('setLeader: %s', name)
    if (this.leader.name === name) return
    if (this.name === name) {
      this.leaderUuid = ''
      return startOwnGroup(this)
    } else {
      const leader = this._players.byName[name]
      this.leaderUuid = leader.uuid
      return joinGroup(this, leader.uuid)
    }
  }

  async getState () {
    const ret = {
      volume: this.volume,
      mute: this.mute,
      leader: this.leader.name
    }

    if (this.isLeader) {
      Object.assign(ret, {
        playState: this.playState,
        ...(await getPositionInfo(this)),
        ...(await getMediaInfo(this))
      })
    }
    this.debug('getState %o', ret)
    return ret
  }

  async restoreState (state) {
    this.debug('restoreState %o', state)
    const { leader, volume, mute } = state
    if (this.leader.name !== leader) await this.setLeader(leader)
    if (this.volume !== volume) await this.setVolume(volume)
    if (this.mute !== mute) await this.setMute(mute)
    if (!this.isLeader) return

    const {
      playState,
      trackNum,
      trackURI,
      // trackMetadata = '',
      trackPos,
      mediaURI,
      mediaMetadata = ''
    } = state

    await setAVTransportURI(this, { mediaURI, mediaMetadata })
    if (parseInt(trackNum) > 1) {
      await seekTrack(this, trackNum)
    }

    if (!isPlaying(playState)) return
    if (trackURI.startsWith('x-file')) {
      await seekPos(this, trackPos)
    }

    await this.play()
  }

  async pause () {
    if (!this.isLeader) return this.leader.pause()
    this.debug('pause')
    await pause(this)
  }

  async play () {
    if (!this.isLeader) return this.leader.play()
    this.debug('play')
    await play(this)
  }

  async playURI (uri) {
    if (!this.isLeader) return this.leader.playURI(uri)
    this.debug('playURI: %s', uri)

    await setAVTransportURI(this, { mediaURI: uri })
    await this.play()
  }

  async playNotification (uri) {
    if (!this.isLeader) return this.leader.playNotification(uri)
    this.debug('playNotification %s', uri)

    const state = await this.getState()

    if (this.isPlaying) {
      await this.pause()
      if (!(await once(() => !this.isPlaying, 500))) {
        this.debug('Could not stop')
        return false
      }
    }

    await this.playURI(uri)

    if (!(await once(() => this.isPlaying), notificationTimeout)) {
      this.debug('Could not start')
      return false
    }

    if (!(await once(() => !this.isPlaying), notificationTimeout)) {
      this.debug('Did not finish')
      return false
    }

    await this.restoreState(state)

    this.debug('Notitication played ok')
    return true
  }
}

function isPlaying (playState) {
  return playState === 'PLAYING' || playState === 'TRANSITIONING'
}