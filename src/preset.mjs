import log from 'logjs'
import Player from './player.mjs'
import { presets } from './config.mjs'

const debug = log
  .prefix('preset:')
  .level(1)
  .colour()

export default async function preset (name) {
  const preset = presets[name]
  if (!preset) {
    throw new Error(`No such preset: ${name}`)
  }

  const players = await Player.discover()
  const controller = findPlayer(players, preset[0].name)

  for (const { name, volume } of preset) {
    const p = findPlayer(players, name)
    await p.sonos.setVolume(volume)
    if (!p.inGroupWith(controller)) {
      await p.sonos.joinGroup(controller.name)
      debug(`${p.name} added to group`)
    }
  }

  const shouldHave = preset.map(p => p.name)
  for (const player of controller.group.members) {
    if (!shouldHave.includes(player.nickname)) {
      await player.sonos.leaveGroup()
      debug(`${player.name} removed from group`)
    }
  }
}

function findPlayer (players, name) {
  const p = players.find(player => player.nickname === name)
  if (p) return p
  throw new Error(`Could not find player: ${name}`)
}
