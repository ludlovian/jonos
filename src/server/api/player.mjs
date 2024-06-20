import send from '@polka/send'

// import Debug from '@ludlovian/debug'
// const debug = Debug('jonos:api:player')

// Send the current player queue.
// The is an object with the following
//
//  - items   - an array of the URLs in being played
//              this might be an empty array if nothing is loaded
//
// and optionally
//
//  - index     - the zero based index into the items array for the
//                currently playing track
//  - pos       - the milliseconds position into the track (at the point
//                of the call)
//  - playMode  - the current playmode, also broken down into:
//  - repeat
//  - shuffle
//  - one

export async function apiPlayerQueue (req, res) {
  const { player } = req
  if (!player.isLeader) {
    return send(res, 404, `${player.name} is not a leader`)
  }
  return send(res, 200, await player.getPlaylist())
}

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
  const { urls, opts } = req.json
  await player.loadMedia(urls, opts)
  return send(res, 200)
}

/*
export async function apiPlayerMute (req, res) {
  debug('apiPlayerMute')
  const { mute } = req.json
  if (typeof mute !== 'boolean') return send(res, 400)
  await req.player.setMute(mute)
  return send(res, 200)
}

export async function apiPlayerNotify (req, res) {
  debug('apiPlayerNotify')
  const { uri } = req.json
  if (typeof uri !== 'string' || !uri.startsWith('http')) return send(res, 400)
  await req.player.playNotification(uri)
  return send(res, 200)
}

*/
