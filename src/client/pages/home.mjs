/** @jsx h */
import { h, Fragment } from 'preact'

import {
  Media,
  Players,
  Link,
  Row,
  Col,
  Choice,
  useModel
} from '../components/index.mjs'

export function Home () {
  const model = useModel()

  return (
    <Fragment>
      {model.leaders.map(player => (
        <GroupSummary key={player} player={player} />
      ))}
      <PresetCommands presets={model.system.presets} />
      <NotifyCommands notifies={model.system.notifies} />
    </Fragment>
  )
}

function GroupSummary ({ player }) {
  return (
    <Fragment>
      <Link href={`/player/${player.name}`}>
        <Media media={player.media} player={player} />
        <Players players={player.members} />
      </Link>
      <hr />
    </Fragment>
  )
}

function PresetCommands ({ presets }) {
  const model = useModel()
  const doPreset = name => model.postCommand(`/api/preset/${name}`)

  return (
    <Row class='my-2'>
      <Col.Command>
        <Choice label='Preset' icon='bi-star-fill'>
          {Object.entries(presets).map(([name, text]) => (
            <Choice.Option
              key={name}
              label={text}
              onclick={() => doPreset(name)}
            />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )
}

function NotifyCommands ({ notifies }) {
  const model = useModel()
  const doNotify = name => model.postCommand(`/api/notify/${name}`)

  return (
    <Row class='my-2'>
      <Col.Command>
        <Choice label='Notify' icon='bi-megaphone-fill'>
          {Object.entries(notifies).map(([name, text]) => (
            <Choice.Option
              key={name}
              label={text}
              onclick={() => doNotify(name)}
            />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )
}
