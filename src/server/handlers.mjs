import Debug from 'debug'

import {
  attach,
  detach,
  subscribe,
  network,
  regroup,
  setVolumes,
  playNotify
} from '../model/index.mjs'
import { log } from './wares.mjs'

const debug = Debug('jonos:server:handlers')

export async function statusUpdates (req, res) {
  debug('statusUpdates: started')
  await attach()

  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })

  log.writeLine(req, res)

  const unsub = subscribe(network.$fullState, sendState)

  req.on('close', stop)

  function sendState (state) {
    const data = JSON.stringify(state)
    res.write(`data: ${data}\n\n`)
  }

  function stop () {
    debug('statusUpdates: stopped')
    unsub()
    detach()
  }
}

export async function groupMembers (req, res) {
  const { leader } = req.params
  const members = req.json
  debug('groupMembers: %s, %o', leader, members)

  const validRequest =
    Array.isArray(members) &&
    isPlayer(leader) &&
    members.every(isPlayer) &&
    members.includes(leader)

  if (!validRequest) {
    debug('Invalid request')
    return res.writeHead(403).end()
  }

  await regroup(leader, members)

  res.writeHead(200).end()
}

export async function groupVolume (req, res) {
  const volumes = req.json
  debug('groupVolumes: $o', volumes)

  const validRequest =
    volumes &&
    Object.keys(volumes).every(isPlayer) &&
    Object.values(volumes).every(isVolume)

  if (!validRequest) {
    debug('Invalid request')
    return res.writeHead(403).end()
  }

  await setVolumes(volumes)

  res.writeHead(200).end()
}

export async function groupNotify (req, res) {
  const { leader } = req.params
  const opts = req.json
  debug('groupNotify: %d, $o', leader, opts)

  const validRequest =
    opts && opts.uri && isVolume(opts.volume) && isLeader(leader)

  if (!validRequest) {
    debug('Invalid request')
    return res.writeHead(403).end()
  }

  await playNotify({ leader, ...opts })

  res.writeHead(200).end()
}

function isPlayer (id) {
  return !!network.$playerDetails.value[id]
}

function isLeader (id) {
  return !!network.$groupMembers.value[id]
}

function isVolume (v) {
  return typeof v === 'number' && v >= 0 && v <= 100
}
