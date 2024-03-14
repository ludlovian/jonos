import send from '@polka/send-type'
import { presets, notifies } from './config.mjs'
import model from '../model/index.mjs'

export async function apiCommandPreset (req, res) {
  const preset = presets[req.params.preset]
  if (!preset) return send(res, 404)
  const { players } = model
  const leader = players.byName[preset.leader]
  if (!leader.isLeader) {
    await leader.setLeader(leader.name)
  }

  const old = new Set(players.groups[leader.name])

  for (const [name, volume] of preset.members) {
    const player = players.byName[name]
    old.delete(name)
    if (player.volume !== volume) await player.setVolume(volume)
    if (player.leader !== leader) {
      if (!player.isLeader) await player.setLeader(player.name)
      await player.setLeader(leader.name)
    }
  }

  await Promise.all(
    [...old].map(async name => {
      const player = players.byName[name]
      await player.setLeader(player.name)
    })
  )

  send(res, 200)
}

export async function apiCommandNotify (req, res) {
  const notify = notifies[req.params.notify]
  if (!notify) return send(res, 404)
  const { players } = model
  const leader = players.byName[notify.leader].leader
  const members = players.groups[leader.name].map(n => players.byName[n])
  const oldVols = members.map(p => p.volume)
  let resume = false
  if (leader.isPlaying) {
    if (notify.resume) resume = true
    await leader.pause()
  }

  await Promise.all(members.map(p => p.setVolume(notify.volume)))

  await leader.playNotification(notify.uri)

  await Promise.all(members.map((p, ix) => p.setVolume(oldVols[ix])))

  if (resume) await leader.play()

  send(res, 200)
}
