/** @jsx h */
import { h, Fragment } from 'preact'
import { useModel } from '../components/index.mjs'

export function About () {
  const { system } = useModel()
  if (!system) return null
  const { players } = system
  return (
    <Fragment>
      <p class='text'>
        <span class='h3'>Sonos Status</span>
        <small class='text mx-2'>version {system.version}</small>
      </p>
      <p>
        Server started: <small>{system.startTime}</small>
      </p>
      <hr />
      <h3>Players</h3>
      <dl>
        {Object.entries(players).map(([name, p]) => (
          <Fragment key={name}>
            <dt>{p.fullName}</dt>
            <dd><small>{p.model}</small></dd>
            <dd><small>{p.url}</small></dd>
            <dd><small>{p.uuid}</small></dd>
          </Fragment>
        ))}
      </dl>
    </Fragment>
  )
}
