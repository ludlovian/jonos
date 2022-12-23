import { URL } from 'url'
import { Sonos, AsyncDeviceDiscovery } from 'sonos'

export default class Player {
  constructor (sonosPlayer) {
    this.sonos = sonosPlayer
  }

  async load () {
    if (this.name) return
    const desc = await this.sonos.deviceDescription()
    Object.assign(this, {
      address: this.sonos.host,
      name: desc.roomName,
      model: desc.displayName
    })
    return this
  }

  static async discover () {
    const discovery = new AsyncDeviceDiscovery()
    const anyPlayer = await discovery.discover()
    const sonosGroups = await anyPlayer.getAllGroups()
    const groups = await Promise.all(
      sonosGroups.map(sonosGroup => new PlayerGroup(sonosGroup))
    )
    return Promise.all(
      groups
        .map(group => [...group.members])
        .flat()
        .map(p => p.load())
    )
  }

  get nickname () {
    return this.name.replace(/ /g, '').toLowerCase()
  }

  isController () {
    return this === this.group.controller
  }

  isPlayer () {
    return this.model.toLowerCase() !== 'boost'
  }

  inGroupWith (other) {
    return this.group === other.group
  }
}

class PlayerGroup {
  constructor (sonosGroup) {
    this.members = new Set()
    for (const member of sonosGroup.ZoneGroupMember) {
      const url = new URL(member.Location)
      const sonosPlayer = new Sonos(url.hostname)
      const player = new Player(sonosPlayer)
      this.members.add(player)
      player.group = this
      if (sonosGroup.host === url.hostname) this.controller = player
    }
  }
}
