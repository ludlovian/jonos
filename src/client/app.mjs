/** @jsx h */
import { h } from 'preact'

import { Row, Col, Text, Router, Link, useModel } from './components/index.mjs'
import { Home, About, PlayerSummary } from './pages/index.mjs'

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
        <About href='/about' />
        <PlayerSummary href='/player/:name' />
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

function AppError ({ error }) {
  return (
    <div class='container'>
      <h1>Error!</h1>
      {error.message}
      <pre>{error.stack || ''}</pre>
    </div>
  )
}
