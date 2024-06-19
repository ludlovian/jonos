/** @jsx h */
import { h, Fragment } from 'preact'
import { useData } from './util.mjs'

export function About () {
  const about = useData()
  if (!about) return

  const { system, players } = about

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
