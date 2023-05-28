import sleep from 'pixutil/sleep'
import { network } from './network.mjs'

export async function regroup (leader, members) {
  let existingMembers = network.$groupMembers.value[leader]

  const leadPlayer = network.findPlayerById(leader)

  // is the new leader already one?
  if (!existingMembers) {
    // make it a new leader of its own group
    await leadPlayer.leaveGroup()
    // now give time to settle as this is a large change
    await sleep(250)
    existingMembers = [leader]
  }

  // which ones do we need to add
  const newMembers = members.filter(member => !existingMembers.includes(member))

  // and which do we need to remove
  const oldMembers = existingMembers.filter(member => !members.includes(member))

  for (const member of newMembers) {
    const player = network.findPlayerById(member)
    await player.addToGroup(leadPlayer)
  }

  for (const member of oldMembers) {
    const player = network.findPlayerById(member)
    await player.leaveGroup()
  }
}
