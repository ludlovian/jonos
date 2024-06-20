import 'preact/debug'
import { h, render } from 'preact'
import { useModel } from './components/index.mjs'
import { App } from './app.mjs'
// const App = () => 'The App'

main()

function main () {
  const model = useModel()
  model.start('/api/status/updates')
  render(h(App), document.body)
}
