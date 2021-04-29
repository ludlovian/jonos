import log from 'logjs'
import { parse } from '@lukeed/ms'

import Player from './player.mjs'

const debug = log
  .prefix('notify')
  .level(1)
  .colour()

const NOTIFY_URLS = {
  downstairs:
    'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3'
}

export default async function notify (
  message,
  { player: playerName, volume, timeout }
) {
  const uri = NOTIFY_URLS[message]
  if (!uri) throw new Error(`Unknown message: ${message}`)

  await Player.discover()
  const controller = Player.get(playerName).group.controller
  const players = Array.from(controller.group.members)

  const oldVolumes = await Promise.all(players.map(p => p.sonos.getVolume()))
  const isPlaying = (await controller.sonos.getCurrentState()) === 'playing'

  debug('Playing message: %s', message)
  // pause the current playing if needed
  if (isPlaying) await controller.sonos.pause()

  // set the volumes manually
  await Promise.all(players.map(p => p.sonos.setVolume(volume)))

  // play the notification
  await Promise.race([
    controller.sonos.playNotification({ uri }),
    delay(parse(timeout))
  ])

  // now reset the volumes
  await Promise.all(players.map((p, i) => p.sonos.setVolume(oldVolumes[i])))

  // and restart the music if necessary
  if (isPlaying) await controller.sonos.play()

  // all done, so schedule an exit
  delay(500).then(() => process.exit(0))
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
