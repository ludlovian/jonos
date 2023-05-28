import { network } from './network.mjs'
import Timer from 'timer'

let users = 0
const tm = new Timer()

export async function attach () {
  if (users++ === 0) {
    // first attach, but the network might still be going
    tm.cancel()
    if (!network.isStarted()) await network.start()
  }
  return true
}

export function detach () {
  if (!users) throw new Error('Detached too many times')

  if (--users === 0) {
    // last one, so schedule a stop soon
    tm.after(5000).call(() => network.stop())
  }
}
