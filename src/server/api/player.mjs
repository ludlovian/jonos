import send from '@polka/send'
import model from '@ludlovian/jonos-model'

export async function apiPlayerVolume (req, res) {
  const { volume } = req.json
  if (typeof volume !== 'number') return send(res, 400)

  await req.player.setVolume(volume)
  return send(res, 200)
}

export async function apiPlayerLeader (req, res) {
  const { leader: name } = req.json
  const { player } = req
  const leader = player.players.byName.get(name)
  // a player can only follow themselves or an existing leader
  if (leader && leader?.name === player.name) {
    if (!player.isLeader) {
      await player.startOwnGroup()
    }
    return send(res, 200)
  } else if (leader && leader?.isLeader) {
    if (player.leader !== leader) {
      // must already be my own leader
      if (!player.isLeader) {
        await player.startOwnGroup()
      }
      await player.joinGroup(leader)
    }
    return send(res, 200)
  } else {
    send(res, 400, 'Invalid leader')
  }
}

export async function apiPlayerPause (req, res) {
  await req.player.pause()
  return send(res, 200)
}

export async function apiPlayerPlay (req, res) {
  await req.player.play()
  return send(res, 200)
}

export async function apiPlayerLoad (req, res) {
  const { player } = req
  const { url, opts } = req.json

  const urls = []
  const item = model.library.locate(url)
  if (item.type === 'album') {
    urls.push(...item.tracks.map(t => t.url))
  } else {
    urls.push(item.url)
  }

  await player.loadMedia(urls, opts)
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
