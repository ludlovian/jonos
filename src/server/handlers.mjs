import Debug from 'debug'

import send from '@polka/send-type'

import { listen, players } from './model/index.mjs'
import { log } from './wares.mjs'

const debug = Debug('jonos:server')

export async function statusUpdates (req, res) {
  debug('statusUpdates: started')

  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })
  log.writeLine(req, res)

  const stopListen = listen(sendState)
  req.on('close', stop)

  function sendState (state) {
    const data = JSON.stringify(state)
    res.write(`data: ${data}\n\n`)
  }

  function stop () {
    debug('statusUpdates: stopped')
    stopListen()
  }
}

export async function status (req, res) {
  debug('getStatus')
  send(res, 200, players.state)
}

export async function setVolume (req, res) {
  debug('setVolume')
  const { volume } = req.json
  if (typeof volume !== 'number') return send(res, 400)

  await req.player.setVolume(volume)
  return send(res, 200)
}

export async function setMute (req, res) {
  debug('setMute')
  const { mute } = req.json
  if (typeof mute !== 'boolean') return send(res, 400)
  await req.player.setMute(mute)
  return send(res, 200)
}

export async function setLeader (req, res) {
  debug('setLeader')
  const { leader: name } = req.json
  const { player } = req
  const leader = players.byName[name]
  // a player can only follow themselves or an existing leader
  const isValid = leader && (leader.isLeader || leader.name === player.name)
  if (!isValid) return send(res, 400, 'Invalid leader')
  await player.setLeader(leader.name)
  return send(res, 200)
}

export async function playNotify (req, res) {
  debug('playNotify')
  const { uri } = req.json
  if (typeof uri !== 'string' || !uri.startsWith('http')) return send(res, 400)
  await req.player.playNotification(uri)
  return send(res, 200)
}

export async function pause (req, res) {
  debug('pause')
  await req.player.pause()
  return send(res, 200)
}

export async function play (req, res) {
  debug('play')
  await req.player.play()
  return send(res, 200)
}
