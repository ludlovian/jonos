import Debug from '@ludlovian/debug'
import send from '@polka/send-type'

import model from '../model/index.mjs'

const debug = Debug('jonos:server')

export async function apiPlayerVolume (req, res) {
  debug('apiPlayerVolume')
  const { volume } = req.json
  if (typeof volume !== 'number') return send(res, 400)

  await req.player.setVolume(volume)
  return send(res, 200)
}

export async function apiPlayerMute (req, res) {
  debug('apiPlayerMute')
  const { mute } = req.json
  if (typeof mute !== 'boolean') return send(res, 400)
  await req.player.setMute(mute)
  return send(res, 200)
}

export async function apiPlayerLeader (req, res) {
  debug('apiPlayerLeader')
  const { leader: name } = req.json
  const { player } = req
  const leader = model.players.byName[name]
  // a player can only follow themselves or an existing leader
  const isValid = leader?.isLeader || leader?.name === player.name
  if (!isValid) return send(res, 400, 'Invalid leader')
  await player.setLeader(leader.name)
  return send(res, 200)
}

export async function apiPlayerNotify (req, res) {
  debug('apiPlayerNotify')
  const { uri } = req.json
  if (typeof uri !== 'string' || !uri.startsWith('http')) return send(res, 400)
  await req.player.playNotification(uri)
  return send(res, 200)
}

export async function apiPlayerPause (req, res) {
  debug('apiPlayerPause')
  await req.player.pause()
  return send(res, 200)
}

export async function apiPlayerPlay (req, res) {
  debug('apiPlayerPlay')
  await req.player.play()
  return send(res, 200)
}
