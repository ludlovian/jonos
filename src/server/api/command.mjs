import send from '@polka/send-type'
import { presets, notifies } from './commandDefs.mjs'
import model from '../model/index.mjs'

const { fromEntries } = Object
const { players } = model

export async function apiCommandPreset (req, res) {
  const preset = presets[req.params.preset]
  if (!preset) return send(res, 404)

  const leader = players.byName[preset.leader]
  const members = new Set(preset.members.map(([name]) => name))

  await setVolumes(fromEntries(preset.members))
  await ensurePlayerIsLeader(leader)
  await transferMusicTo(leader)
  await removeUnwantedPlayers(leader, members)
  await addMissingPlayers(leader, members)
  send(res, 200)
}

function setVolumes (volumes) {
  return Promise.all(
    Object.entries(volumes).map(async ([name, volume]) => {
      const player = players.byName[name]
      if (player.volume !== volume) await player.setVolume(volume)
    })
  )
}

async function ensurePlayerIsLeader (player) {
  if (player.isLeader) return
  await player.setLeader(player.name)
}

async function transferMusicTo (leader) {
  if (leader.isPlaying || !players.active.length) return undefined
  const current = players.byName[players.active[0]]
  const state = await current.getState()
  await current.pause()
  await leader.restoreState({
    ...state,
    leader: leader.name,
    volume: leader.volume
  })
}

function removeUnwantedPlayers (leader, members) {
  return Promise.all(
    players.groups[leader.name]
      .filter(name => !members.has(name))
      .map(name => players.byName[name])
      .map(player => player.setLeader(player.name))
  )
}

function addMissingPlayers (leader, members) {
  const currentMembers = new Set(players.groups[leader.name])
  return Promise.all(
    [...members]
      .filter(name => !currentMembers.has(name))
      .map(name => players.byName[name])
      .map(player => player.setLeader(leader.name))
  )
}

export async function apiCommandNotify (req, res) {
  const notify = notifies[req.params.notify]
  if (!notify) return send(res, 404)
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
