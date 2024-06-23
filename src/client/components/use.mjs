import { useMemo, useEffect } from 'preact/hooks'
import Bouncer from '@ludlovian/bouncer'
import linkSignals from '@ludlovian/link-signals'

export { useModel } from '../model/index.mjs'

export function useBouncer (props, deps = []) {
  return useMemo(() => new Bouncer(props), deps)
}
export function useLinkSignals (...inputs) {
  useEffect(() => linkSignals(...inputs), [])
}
