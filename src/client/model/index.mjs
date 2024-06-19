import Model from './model.mjs'
const model = new Model()
window.model = model

function useModel () {
  return model
}

export { useModel }
