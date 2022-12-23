import log from 'logjs'
import timeout from 'pixutil/timeout'
import { parse } from '@lukeed/ms'

import Player from './player.mjs'
import { notifyMessages } from './config.mjs'

const debug = log
  .prefix('notify:')
  .level(1)
  .colour()

export default async function notify ({
  message: messageName,
  player: playerName,
  volume,
  timeout: timeoutDelay,
  resume
}) {
  const message = notifyMessages[messageName]
  if (!message) throw new Error(`Unknown message ${messageName}`)

  const allPlayers = await Player.discover()
  const player = allPlayers.find(p => p.nickname === playerName)
  if (!player) throw new Error(`Unknown player: ${playerName}`)

  const controller = player.group.controller
  const players = [...controller.group.members]

  debug('getting old volumes')
  const oldVolumes = await Promise.all(players.map(p => p.sonos.getVolume()))
  const isPlaying = (await controller.sonos.getCurrentState()) === 'playing'

  // pause the current playing if needed
  if (isPlaying) {
    debug('stopping music')
    await controller.sonos.pause()
  }

  // set the volumes manually
  debug('Setting volumes to %d', volume)
  await Promise.all(players.map(p => p.sonos.setVolume(volume)))

  // play the notification
  debug('Playing message: %s', messageName)
  const pNotify = timeout(
    controller.sonos.playNotification({ uri: message.uri }),
    parse(timeoutDelay)
  )

  try {
    await pNotify
  } catch (e) {
    if (e instanceof timeout.TimedOut) {
      console.error('Timed out playing %s', messageName)
    } else {
      throw e
    }
  }

  // now reset the volumes
  debug('resetting volumes to %s', oldVolumes)
  await Promise.all(players.map((p, i) => p.sonos.setVolume(oldVolumes[i])))

  // and restart the music if necessary
  if (isPlaying && resume) {
    debug('restarting music')
    await controller.sonos.play()
  }
}
