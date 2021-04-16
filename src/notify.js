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
  const p = Player.get(playerName)
  debug('Playing message: %s', message)

  await Promise.race([
    p.sonos.playNotification({ uri, volume }),
    timeoutAndExit(timeout)
  ])
}

async function timeoutAndExit (timeout) {
  await Promise.delay(ms(timeout + ''))
  setImmediate(() => process.exit(0))
}
