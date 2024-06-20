/** @jsx h */
import { h } from 'preact'

import { Row, Col, Text, Router, Link, useModel } from './components/index.mjs'
import { Home, About, Queue, Group } from './pages/index.mjs'

export function App () {
  const model = useModel()
  if (model.error) {
    return <AppError error={model.error} />
  }
  if (model.isLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <div class='container'>
      <AppTitle />
      <Router>
        <About.Async href='/about' />
        <PlayerRoutes href='/player/:name/*' />
        <Home />
      </Router>
    </div>
  )
}

function AppTitle () {
  return (
    <Link href='/about'>
      <Row.Title>
        <Col.Title>
          <Text.Title>Jonos</Text.Title>
        </Col.Title>
      </Row.Title>
    </Link>
  )
}

function PlayerRoutes ({ href, name }) {
  const model = useModel()
  const player = model.byName[name]

  if (!player) {
    model.error = new Error(`No such player: ${name}`)
    return
  }

  return (
    <Router prefix={href} player={player}>
      <Queue.Async href='/queue' />
      <Group href='/group' />
    </Router>
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
