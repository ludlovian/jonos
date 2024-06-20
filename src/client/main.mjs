import 'preact/debug'
import { h, render } from 'preact'
import { App } from './app.mjs'
import { useModel } from './components/index.mjs'

main()

function main () {
  const model = useModel()
  model.start('/api/status/updates')
  render(h(App), document.body)
}
