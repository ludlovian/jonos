// import 'preact/debug'
import { h, render } from 'preact'

import { Row, Col, Text, Router, Link } from './components/index.mjs'
import { Home, About, Queue, Group } from './pages/index.mjs'
import { useModel } from './model/index.mjs'

main()

function main () {
  const model = useModel()
  model.start('/api/status/updates')
  render(h(App), document.body)
}

function App () {
  const model = useModel()
  if (model.error) {
    return <AppError error={model.error} />
  }
  if (model.isLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <div class='container'>
      <Link href='/about'>
        <Row.Title>
          <Col.Title>
            <Text.Title>Jonos</Text.Title>
          </Col.Title>
        </Row.Title>
      </Link>
      <Router>
        <Queue href='/group/:leader/queue' />
        <Group href='/group/:leader/members' />
        <About href='/about' />
        <Home />
      </Router>
    </div>
  )
}

function AppError ({ error }) {
  return (
    <div class='container'>
      <h1>Error!</h1>
      {error.message}
      <pre>{error.stack || ''}</pre>
    </div>
  )
}
