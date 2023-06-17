import { signal, computed, effect } from '@preact/signals-core'

export function addSignals (target, signalProps) {
  const defs = {}

  for (const [key, value] of Object.entries(signalProps)) {
    if (typeof value === 'function') {
      const $c = computed(value)
      defs[key] = {
        get: () => $c.value,
        enumerable: true,
        configurable: false
      }
    } else {
      const $s = signal(value)
      defs[key] = {
        get: () => $s.value,
        set: x => ($s.value = x),
        enumerable: true,
        configurable: false
      }
    }
  }

  return Object.defineProperties(target, defs)
}

// resolves once a reactive function returns truthy
export function once (fn, timeout) {
  return new Promise(resolve => {
    const tm = timeout ? setTimeout(() => resolve(false), timeout) : null
    const dispose = effect(() => {
      if (!fn()) return
      dispose()
      if (tm) clearTimeout(tm)
      resolve(true)
    })
  })
}
