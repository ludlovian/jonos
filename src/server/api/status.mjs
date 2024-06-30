import process from 'node:process'
import send from '@polka/send'
import Debug from '@ludlovian/debug'
import Timer from '@ludlovian/timer'
import { serialize } from '@ludlovian/serialize-json'
import subscribeSignal from '@ludlovian/subscribe-signal'
import model from '@ludlovian/jonos-model'

import config from '../config.mjs'
import { log } from '../wares.mjs'

const debug = Debug('jonos:api:status')

const systemCore = {
  isDev: process.env.NODE_ENV !== 'production',
  started: new Date(),
  version: process.env.npm_package_version ?? 'dev'
}

const serializeOpts = { date: true }

export async function apiStatusUpdates (req, res) {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  })
  log.writeLine(req, res)

  const tmHeartbeat = new Timer({
    ms: config.heartbeatPeriod,
    repeat: true,
    fn: () => res.write(':\n\n')
  })

  const stopListen = listen(sendState)
  req.on('close', stop)

  function sendState (state) {
    const data = JSON.stringify(serialize(state, serializeOpts))
    res.write(`data: ${data}\n\n`)
  }

  function stop () {
    tmHeartbeat.cancel()
    stopListen()
  }
}

export async function apiStatus (req, res) {
  debug('apiStatus')
  send(res, 200, serialize(getState(), serializeOpts))
}

function listen (callback) {
  model.listeners++
  debug('Listener added: %d', model.listeners)
  const debounce = config.statusThrottle
  const unsub = subscribeSignal(getState, callback, { debounce, depth: 3 })
  return () => {
    unsub()
    model.listeners--
    debug('Listener removed: %d', model.listeners)
  }
}

function getState () {
  const system = getSystem()
  const players = getPlayers()
  return { system, players }
}

function getSystem () {
  return {
    ...systemCore,
    players: model.players.players.map(p => ({
      name: p.fullName,
      model: p.model,
      url: p.url
    }))
  }
}

function getPlayers () {
  const { players } = model.players
  return Object.fromEntries(players.map(p => [p.name, getPlayerState(p)]))
}

function getPlayerState (p) {
  return {
    fullName: p.fullName,
    volume: p.volume,
    mute: p.mute,
    leaderName: p.leader.name,
    isPlaying: p.isLeader ? p.isPlaying : null,
    trackUrl: p.isLeader ? p.trackUrl : null,
    queue: p.queue,
    media: p.media
  }
}
