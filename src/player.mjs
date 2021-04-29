import { URL } from 'url'
import { Sonos, AsyncDeviceDiscovery } from 'sonos'
import log from 'logjs'

const debug = log
  .prefix('playeri:')
  .level(2)
  .colour()

export default class Player {
  constructor (sonosPlayer) {
    Object.defineProperty(this, 'sonos', {
      configurable: true,
      value: sonosPlayer
    })
  }

  async _load () {
    const desc = await this.sonos.deviceDescription()
    Object.assign(this, {
      address: this.sonos.host,
      name: desc.roomName,
      model: desc.displayName
    })
  }

  static async getAny () {
    const discovery = new AsyncDeviceDiscovery()
    return Player.fromSonos(await discovery.discover())
  }

  static async fromSonos (sonosPlayer) {
    const p = new Player(sonosPlayer)
    await p._load()
    return p
  }

  static async discover () {
    const any = await Player.getAny()
    const sonosGroups = await any.sonos.getAllGroups()
    Player.groups.clear()
    await Promise.all(sonosGroups.map(PlayerGroup.fromSonos))
    debug('%d group(s) discovered', Player.groups.size)
    return Player.groups
  }

  static get (name) {
    for (const p of Player.all({ includeBoost: true })) {
      if (p.name === name || p.nickname === name || p.address === name) {
        return p
      }
    }
    throw new Error(`No such player: ${name}`)
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

Player.groups = new Set()
Player.all = function * all ({ includeBoost } = {}) {
  for (const group of Player.groups) {
    for (const player of group.members) {
      if (includeBoost || player.isPlayer()) {
        yield player
      }
    }
  }
}

class PlayerGroup {
  constructor () {
    this.members = new Set()
    Player.groups.add(this)
  }

  static async fromSonos (sonosGroup) {
    const group = new PlayerGroup()
    const address = sonosGroup.host

    await Promise.all(
      sonosGroup.ZoneGroupMember.map(async member => {
        const url = new URL(member.Location)
        const player = await Player.fromSonos(new Sonos(url.hostname))
        group._add(player, { asController: player.address === address })
      })
    )

    debug('Group of size %d discovered', group.members.size)
    return group
  }

  // controller is always the first member
  get controller () {
    return this.members.values().next().value
  }

  set controller (player) {
    this.members = new Set([player, ...this.members])
  }

  _add (player, { asController } = {}) {
    if (player.group) player.group._remove(player)
    player.group = this
    this.members.add(player)
    if (asController) this.controller = player
  }
}
