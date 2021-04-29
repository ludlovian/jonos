import log from 'logjs'

import Player from './player.mjs'

const debug = log
  .prefix('join:')
  .level(1)
  .colour()

const PLAYERS = [
  { name: 'bedroom', volume: 25 },
  { name: 'parlour', volume: 25 },
  { name: 'bookroom', volume: 25 },
  { name: 'kitchen', volume: 25 },
  { name: 'office', volume: 12 },
  { name: 'diningroom', volume: 12 }
]

export default async function join () {
  await Player.discover()

  const bedroom = Player.get('bedroom')
  if ((await bedroom.sonos.getCurrentState()) !== 'playing') {
    debug('Bedroom not playing. Quitting')
    return
  }

  let dirty

  for (const { name, volume } of PLAYERS) {
    const p = Player.get(name)
    await p.sonos.setVolume(volume)
    debug('%s volume set', name)
    if (!p.inGroupWith(bedroom)) {
      await p.sonos.joinGroup(bedroom.name)
      dirty = true
      debug('%s added to group', name)
    }
  }

  if (dirty) {
    await Player.discover()
  }
}
