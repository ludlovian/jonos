import { batch } from '@preact/signals-core'
import Debug from '@ludlovian/debug'
import addSignals from '@ludlovian/signal-extra/add-signals'
import until from '@ludlovian/signal-extra/until'
import Timer from 'timer'

import { getTrackDetails } from './track.mjs'
import { notificationTimeout } from '../config.mjs'
import {
  subscribe as sonosSubscribe,
  getDeviceDescription,
  getMediaInfo,
  getPositionInfo,
  getTransportInfo,
  getVolume,
  getMute,
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
  constructor (players, data) {
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
      subscription: null,

      // derived
      trackDetails: () => getTrackDetails(this.trackURI, this.trackMetadata),
      leader: () => this._players.byUuid[this.leaderUuid] ?? this,
      isLeader: () => this.leader === this,
      isPlaying: () => this.isLeader && isPlaying(this.playState),
      isSubscribed: () => !!this.subscription,
      state: () => ({
        name: this.name,
        fullName: this.fullName,
        leaderName: this.leader.name,
        playState: this.isLeader ? this.playState : '',
        trackDetails: this.isLeader ? this.trackDetails : [],
        volume: this.volume,
        mute: this.mute
      })
    })

    Object.assign(this, data)
    this.debug = Debug(`jonos:player:${this.name}`)
  }

  //
  // Subscription to Sonos notification events
  //

  async subscribe () {
    // subscribe will always succeed - if it errors
    // it simply removes the subscription
    if (this.isSubscribed) return null
    this.subscription = sonosSubscribe(this)
    await this.subscription.start().catch(err => {
      console.error(err)
      this.subscription = null
    })
  }

  async unsubscribe () {
    // unsubscribe will always succeed
    if (!this.isSubscribed) return null
    const sub = this.subscription
    this.subscription = null
    await sub.stop().catch(err => {
      console.log(err)
    })
  }

  reset () {
    if (!this.isSubscribed) return null
    this.subscription.reset()
    this.subscription = null
  }

  onData (data) {
    if (!data) return
    batch(() => {
      for (const [k, v] of Object.entries(data)) {
        if (k in this && this[k] !== v) {
          this.debug('Updated %s', k)
          this[k] = v
        }
      }
      if (this.keystone) this._players.onData(data)
    })
  }

  //
  // Basic XML description
  //

  async update () {
    this.onData({
      ...((await getDeviceDescription(this)) ?? {}),
      ...((await getPositionInfo(this)) ?? {}),
      ...((await getTransportInfo(this)) ?? {}),
      ...((await getVolume(this)) ?? {}),
      ...((await getMute(this)) ?? {})
    })
  }

  async getDescription () {
    if (this.model) return
    const data = await getDeviceDescription(this)
    this.onData(data)
  }

  //
  // SOAP-based commands
  //

  async setVolume (vol) {
    this.debug('setVolume: %d', vol)
    await this.subscribe()
    await setVolume(this, vol, () => this.volume === vol)
  }

  async setMute (mute) {
    this.debug('setMute: %o', mute)
    await this.subscribe()
    await setMute(this, mute, () => this.mute === mute)
  }

  async setLeader (name) {
    this.debug('setLeader: %s', name)
    if (this.leader.name === name) return
    await this.subscribe()
    if (this.name === name) {
      await startOwnGroup(this, () => this.leaderUuid === '')
    } else {
      const leader = this._players.byName[name]
      await joinGroup(this, leader.uuid, () => this.leaderUuid === leader.uuid)
    }
  }

  async getState () {
    const ret = {
      volume: this.volume,
      mute: this.mute,
      leader: this.leader.name
    }

    if (this.isLeader) {
      const { trackNum, trackURI, trackPos } = await getPositionInfo(this)
      const { mediaURI, mediaMetadata = '' } = await getMediaInfo(this)
      Object.assign(ret, {
        playState: this.playState,
        trackNum,
        trackURI,
        trackPos,
        mediaURI,
        mediaMetadata
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
      trackPos,
      mediaURI,
      mediaMetadata = ''
    } = state

    if (!mediaURI) return

    await setAVTransportURI(this, { mediaURI, mediaMetadata })
    if (parseInt(trackNum) > 1) {
      await seekTrack(this, trackNum)
    }

    if (trackURI.startsWith('x-file')) {
      await seekPos(this, trackPos)
    }

    if (isPlaying(playState)) {
      await this.play()
    }
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

    const tm = new Timer({
      every: 1e3,
      fn: () => getTransportInfo(this).then(data => this.onData(data))
    })

    if (this.isPlaying) {
      await this.pause()
      if (!(await until(() => !this.isPlaying, 500))) {
        this.debug('Could not stop')
        tm.cancel()
        return false
      }
    }

    await this.playURI(uri)

    if (!(await until(() => this.isPlaying), notificationTimeout)) {
      this.debug('Could not start')
      tm.cancel()
      return false
    }

    if (!(await until(() => !this.isPlaying), notificationTimeout)) {
      this.debug('Did not finish')
      tm.cancel()
      return false
    }

    tm.cancel()

    await this.restoreState(state)

    this.debug('Notitication played ok')
    return true
  }
}

function isPlaying (playState) {
  return playState === 'PLAYING' || playState === 'TRANSITIONING'
}
