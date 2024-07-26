import send from '@polka/send'
import model from '@ludlovian/jonos-model'

export async function apiPlayerVolume (req, res) {
  const { volume } = req.json
  if (typeof volume !== 'number') return send(res, 400)

  await req.player.doTask('setVolume', volume)
  return send(res, 200)
}

export async function apiPlayerLeader (req, res) {
  const { leader: name } = req.json
  if (!model.byName[name]) return send(res, 400)
  if (name === req.player.name) {
    await req.player.doTask('startGroup')
  } else {
    await req.player.doTask('joinGroup', name)
  }
  return send(res, 200)
}

export async function apiPlayerPause (req, res) {
  await req.player.doTask('pause')
  return send(res, 200)
}

export async function apiPlayerPlay (req, res) {
  await req.player.doTask('play')
  return send(res, 200)
}

export async function apiPlayerLoad (req, res) {
  const { url, opts } = req.json
  await req.player.doTask('loadMedia', url, opts)
  return send(res, 200)
}

export async function apiPlayerPreset (req, res) {
  const { player } = req
  const { volumes } = req.json

  await player.createGroup(volumes)
  return send(res, 200)
}

export async function apiPlayerNotifcation (req, res) {
  const { player } = req
  const { url, opts } = req.json

  await player.playNotification(url, opts)
  return send(res, 200)
}
