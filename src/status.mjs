import sortBy from 'sortby'

import Player from './player.mjs'

export default async function status () {
  const allPlayers = await Player.discover()
  const players = allPlayers.filter(p => p.isPlayer())
  const groups = [...new Set(players.map(p => p.group))].sort(
    sortBy(g => g.controller.name)
  )
  return {
    groups: await Promise.all(
      groups.map(async g => {
        const c = g.controller
        const state = await c.sonos.getCurrentState()
        const sortedMembers = Array.from(g.members).sort(sortBy(p => p.name))
        const members = await Promise.all(
          [...new Set([c, ...sortedMembers])].map(async m => {
            const name = m.name
            const volume = await m.sonos.getVolume()
            return { name, volume }
          })
        )
        return { state, members }
      })
    )
  }
}
