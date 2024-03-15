import send from '@polka/send-type'
import { presets, notifies } from './commandDefs.mjs'
import model from '../model/index.mjs'

export async function apiCommandPreset (req, res) {
  const preset = presets[req.params.preset]
  if (!preset) return send(res, 404)
  const { players } = model

  // First we sort out the new leader
  // If they are not a leader, then we must:
  // - find out what they are playing
  // - stop playback
  // - make them a leader
  // - start playback
  const leader = players.byName[preset.leader]
  const volumes = Object.fromEntries(preset.members)
  const members = preset.members.map(([name]) => name)

  if (!leader.isLeader) {
    const oldLeader = leader.leader
    const state = await oldLeader.getState()
    await leader.setLeader(leader.name)
    if (oldLeader.isPlaying) await oldLeader.pause()
    await leader.restoreState({
      ...state,
      leader: leader.name,
      volume: volumes[leader.name]
    })
  }

  // Now we remove any members who should not be in this group
  const toRemove = new Set(players.groups[leader.name])
  for (const name of members) {
    toRemove.delete(name)
  }

  for (const name of toRemove) {
    const player = players.byName[name]
    await player.setLeader(player.name)
  }

  // Finally we add members to the group who are missing
  for (const name of members) {
    const player = players.byName[name]
    const volume = volumes[name]

    if (player.volume !== volume) await player.setVolume(volume)
    if (player.leader !== leader) {
      if (!player.isLeader) await player.setLeader(player.name)
      await player.setLeader(leader.name)
    }
  }

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
