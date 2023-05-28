import { network } from './network.mjs'

export async function setVolumes (volumes) {
  const input = Object.entries(volumes)
  const proms = input.map(setVolume)
  await Promise.all(proms)
  return true

  async function setVolume ([id, volume]) {
    const player = network.findPlayerById(id)
    await player.setVolume(volume)
  }
}
