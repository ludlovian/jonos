import Debug from 'debug'
import ms from 'ms'
import promiseGoodies from 'promise-goodies'

import Player from './player'

const debug = Debug('jonos:cmd:notify')

const NOTIFY_URLS = {
  downstairs:
    'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3'
}

export default async function notify (
  message,
  { player: playerName, volume, timeout }
) {
  promiseGoodies()

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
    Promise.delay(ms(timeout + ''))
  ])

  // now reset the volumes
  await Promise.all(players.map((p, i) => p.sonos.setVolume(oldVolumes[i])))

  // and restart the music if necessary
  if (isPlaying) await controller.sonos.play()

  // all done, so schedule an exit
  setTimeout(() => process.exit(0), 500)
}
