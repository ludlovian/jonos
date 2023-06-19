import { h, render } from 'preact'
import { App } from './ui.mjs'
import model from './model.mjs'

function main () {
  model.start('/api/status/updates')
  render(h(App), document.body)
}

main()
