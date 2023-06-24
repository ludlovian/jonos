import { effect } from '@preact/signals-core'
import equal from 'pixutil/equal'
import clone from 'pixutil/clone'
import Bouncer from 'bouncer'

import { statusThrottle } from '../config.mjs'

export default function subscribe (getState, callback) {
  const bouncer = new Bouncer({
    every: statusThrottle,
    fn: sendDiff,
    leading: true
  })
  let prev = {}
  const disposeEffect = effect(() => {
    getState()
    bouncer.fire()
  })
  return () => {
    bouncer.stop()
    disposeEffect()
  }

  function sendDiff () {
    const latest = getState()
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
    if (isPOJO(value)) {
      ret[key] = diffObject(from[key] || {}, value)
    } else {
      ret[key] = value
    }
  }
  for (const key of fromKeys) ret[key] = null
  return ret
}

function isPOJO (x) {
  return x && typeof x === 'object' && x.constructor === Object
}
