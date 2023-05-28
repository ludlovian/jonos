import { effect } from '@preact/signals-core'
import Debug from 'debug'

import equal from 'pixutil/equal'
import clone from 'pixutil/clone'
import Timer from 'timer'

const debug = Debug('jonos:model:subscribe')
//
// Subscribes to a signal to receive updares
//
// Callback only receives changes - if a key is the same
// value, it is not sent
//
// Also debounces calls if debounce set
//

export function subscribe ($signal, fn, debounce = 100) {
  debug('subscribing')
  const prev = {}
  const tm = new Timer()
  return effect(onChange)

  // called on every changed to the signal's value
  function onChange () {
    const data = $signal.value
    // if we are not debouncing, then send the diff
    // straight away
    if (!debounce) {
      sendDiff(data)
      return
    }

    // we are debouncing, so clear any existing pending
    // call and schedule a later one. This will be fired
    // only after a quiescent period
    tm.after(debounce).call(() => sendDiff(data))
  }

  // Send the diff between this data and the last one
  // we actually sent
  function sendDiff (data) {
    const diff = {}
    for (const k of Object.keys(data)) {
      if (!equal(data[k], prev[k])) {
        diff[k] = clone(data[k])
        prev[k] = data[k]
      }
    }
    if (Object.keys(diff).length) {
      fn(diff)
    }
  }
}
