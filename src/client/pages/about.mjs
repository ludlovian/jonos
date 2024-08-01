/** @jsx h */
import { h, Fragment } from 'preact'
import { useModel } from '../components/index.mjs'

export function About () {
  const model = useModel()
  const { players, system } = model
  if (!system) return null
  return (
    <Fragment>
      <p class='text'>
        <span class='h3'>Sonos Status</span>
        <small class='text mx-2'>version {system.version}</small>
      </p>
      <p>
        Server started: <small>{system.startTime}</small>
      </p>
      <p>Listeners: {system.listeners}</p>
      <p>Listening: {system.listening ? 'yes' : 'no'}</p>
      <hr />
      <h3>Players</h3>
      <dl>
        {players.map(p => (
          <Fragment key={p.name}>
            <dt>{p.fullName}</dt>
            <dd>
              <small>{p.model}</small>
            </dd>
            <dd>
              <small>{p.url}</small>
            </dd>
            <dd>
              <small>{p.uuid}</small>
            </dd>
          </Fragment>
        ))}
      </dl>
    </Fragment>
  )
}
