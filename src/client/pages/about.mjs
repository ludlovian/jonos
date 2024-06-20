/** @jsx h */
import { h, Fragment } from 'preact'
import { useModel, useData } from '../components/index.mjs'

About.Async = function AboutAsync () {
  const model = useModel()
  const data = useData(async () => model.fetchData('/api/about'))
  if (!data) return null
  return <About {...data} />
}

export function About ({ system, players }) {
  return (
    <Fragment>
      <p class='text'>
        <span class='h3'>Sonos Status</span>
        <small class='text mx-2'>
          version {system.version}
          {system.isDev && ' dev'}
        </small>
      </p>
      <p>Server started: {system.started.toString()}</p>
      <hr />
      <h3>Players</h3>
      <ul>
        {players.map(p => (
          <li key={p.name}>
            {p.name} ({p.model}) {p.url}
          </li>
        ))}
      </ul>
    </Fragment>
  )
}
