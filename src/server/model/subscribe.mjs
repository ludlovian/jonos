import { effect } from '@preact/signals-core'
import Debug from 'debug'

import equal from 'pixutil/equal'
import clone from 'pixutil/clone'
import Serial from 'pixutil/serial'
import Bouncer from 'bouncer'
import Timer from 'timer'

import players from './players.mjs'
import {
  sonosLastListenerDelay,
  statusThrottle,
  sonosResetPeriod
} from '../config.mjs'

const serial = new Serial()
const debug = Debug('jonos:model')

let listenerCount = 0
const tmCleanup = new Timer()
const tmReset = new Timer()

tmReset.set({
  every: sonosResetPeriod,
  fn: () => {
    if (listenerCount) return
    players.restart()
  }
})

async function addListener () {
  debug('listener added')
  tmCleanup.cancel()
  if (listenerCount++) return
  await serial.exec(() => players.subscribeAll())
}

async function removeListener () {
  debug('listener removed')
  // do nothing if zero or more than one
  if (!listenerCount || --listenerCount) return
  tmCleanup.set({
    after: sonosLastListenerDelay,
    fn: () => serial.exec(() => players.unsubscribeAll())
  })
}

export default function listen (callback) {
  addListener()
  const bouncer = new Bouncer({
    every: statusThrottle,
    fn: sendDiff,
    leading: true
  })
  let prev = {}
  const disposeEffect = effect(onStateChange)
  return cleanup

  function onStateChange () {
    bouncer.fire(players.state)
  }

  function cleanup () {
    bouncer.stop()
    disposeEffect()
    removeListener()
  }

  function sendDiff () {
    const latest = players.state
    const diff = diffObject(prev, latest)
    if (Object.keys(diff).length) callback(diff)
    prev = clone(latest)
  }
}

function diffObject (from, to) {
  const ret = {}
  const fromKeys = new Set(Object.keys(from))

  for (const [key, value] of Object.entries(to)) {
    fromKeys.delete(key)
    if (key in from && equal(from[key], to[key])) continue
    if (value && typeof value === 'object') {
      ret[key] = diffObject(from[key] || {}, value)
    } else {
      ret[key] = value
    }
  }
  for (const key of fromKeys) ret[key] = null
  return ret
}
