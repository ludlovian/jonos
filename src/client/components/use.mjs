import { useState } from 'preact/hooks'

import { getVersion } from './router.mjs'

export { useModel } from '../model/index.mjs'

export function useData (fn, deps) {
  deps = Array.isArray(deps) ? [...deps, getVersion()] : deps
  const [data, setData] = useState(null, deps)
  if (data !== null) return data
  Promise.resolve()
    .then(fn)
    .then(setData)
}
