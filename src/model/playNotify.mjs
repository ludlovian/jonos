import Debug from 'debug'
import sleep from 'pixutil/sleep'

import { network } from './network.mjs'
import { setVolumes } from './setVolumes.mjs'

const debug = Debug('jonos:model:playNotify')

export async function playNotify ({ leader, uri, volume, resume }) {
  debug('playNotify, %s, %s, %d, %o', leader, uri, volume, resume)
  const groupMembers = network.$groupMembers.value[leader]

  const leadPlayer = network.findPlayerById(leader)

  // get current volumes
  const oldVolumes = Object.fromEntries(
    groupMembers
      .map(member => network.findPlayerById(member))
      .map(player => [player.id, player.$volume.value])
  )

  // prepare new volumes
  const newVolumes = { ...oldVolumes }
  for (const k in newVolumes) {
    newVolumes[k] = volume
  }

  const wasPlaying = leadPlayer.isPlaying()
  if (wasPlaying) {
    await leadPlayer.device.Pause()
    await sleep(50)
  }

  // set the volumes
  await setVolumes(newVolumes)
  await sleep(100)

  // play the notification
  await leadPlayer.device.PlayNotification({
    trackUri: uri,
    timeout: 10
  })

  // reset the volumes
  await setVolumes(oldVolumes)

  // and restart if asked
  if (wasPlaying && resume) await leadPlayer.device.Play()
}
