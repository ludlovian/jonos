import { useModel } from '../model/index.mjs'

function useData () {
  return useModel().router.data
}

export { useModel, useData }
