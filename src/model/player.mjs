import { signal } from '@preact/signals-core'
import { SonosEvents } from '@svrooij/sonos'
import Debug from 'debug'

const EVENTS = [
  [SonosEvents.Mute, '$muted'],
  [SonosEvents.Volume, '$volume'],
  [SonosEvents.CurrentTransportStateSimple, '$playState'],
  [SonosEvents.Coordinator, '$leader'],
  [SonosEvents.CurrentTrackUri, '$currentUri']
]

export default class Player {
  static async fromDevice (device) {
    const p = new Player(device)
    const { displayName: model } = await device.GetDeviceDescription()
    const { volume, muted, transportState: playState } = await device.GetState()

    p.model = model

    p.$volume.value = volume
    p.$muted.value = muted
    p.$playState.value = playState

    return p
  }

  constructor (device) {
    // basic static data
    this.device = device
    this.name = device.name
    this.address = device.host
    this.uuid = device.uuid
    this.id = this.name.replaceAll(' ', '').toLowerCase()

    this.debug = Debug('jonos:model:player:' + this.id)

    // static, but gathered later
    this.model = undefined

    // dynamic
    this.$volume = signal(0)
    this.$muted = signal(false)
    this.$playState = signal('')
    this.$leader = signal(device.Coordinator.uuid)
    this.$currentUri = signal('')
  }

  isLeader () {
    return this.$leader.value === this.uuid
  }

  follows (other) {
    return this.$leader.value === other.uuid
  }

  isPlaying () {
    return this.$playState.value === 'PLAYING'
  }

  get deviceData () {
    const { name, address, model } = this
    return { name, address, model }
  }

  get currentState () {
    return {
      volume: this.$volume.value,
      muted: this.$muted.value,
      playState: this.$playState.value,
      uri: this.$currentUri.value
    }
  }

  subscribe () {
    const ev = this.device.Events
    for (const [event, sigName] of EVENTS) {
      const $signal = this[sigName]
      if (!$signal) throw new Error('Signal doesnt exist!')
      ev.on(event, value => {
        $signal.value = value
      })
    }
  }

  unsubscribe () {
    const ev = this.device.Events
    for (const [event] of EVENTS) {
      ev.removeAllListeners(event)
    }
  }

  async addToGroup (other) {
    await this.device.JoinGroup(other.name)
    this.$leader.value = other.uuid
  }

  async leaveGroup () {
    await this.device.AVTransportService.BecomeCoordinatorOfStandaloneGroup({
      InstanceID: 0
    })
    this.$leader.value = this.uuid
  }

  async setVolume (volume) {
    this.debug('setVolume: %d', volume)
    await this.device.SetVolume(volume)
    this.$volume.value = volume
  }
}
