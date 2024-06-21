import { useMemo } from 'preact/hooks'
import Bouncer from '@ludlovian/bouncer'

export { useModel } from '../model/index.mjs'

export function useBouncer (props, deps = []) {
  return useMemo(() => new Bouncer(props), deps)
}
