/** @jsx h */
import { h, Fragment } from 'preact'
import sortBy from '@ludlovian/sortby'

import {
  Media,
  Players,
  Link,
  Row,
  Col,
  Choice,
  useModel
} from '../components/index.mjs'
import config from '../config.mjs'

export function Home () {
  const model = useModel()

  const leaders = [...model.groups.keys()].sort(
    sortBy('isPlaying', 'desc').thenBy('name')
  )

  return (
    <Fragment>
      {leaders.map(player => (
        <GroupSummary key={player} player={player} />
      ))}
      <PresetCommands presets={config.presets} />
      <NotifyCommands notifies={config.notifies} />
    </Fragment>
  )
}

function GroupSummary ({ player }) {
  let players = [...player.followers]
  players = players.sort(sortBy('fullName'))
  players = [...new Set([player, ...players])]

  return (
    <Fragment>
      <Link href={`/player/${player.name}`}>
        <Media item={player.media} player={player} />
        <Players players={players} />
      </Link>
      <hr />
    </Fragment>
  )
}

function PresetCommands ({ presets }) {
  const model = useModel()
  const doPreset = (leader, volumes) => model.byName[leader].preset(volumes)

  return (
    <Row class='my-2'>
      <Col.Command>
        <Choice label='Preset' icon='bi-star-fill'>
          {presets.map(({ name, leader, volumes }) => (
            <Choice.Option
              key={name}
              label={name}
              onclick={() => doPreset(leader, volumes)}
            />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )
}

function NotifyCommands ({ notifies }) {
  const model = useModel()
  const doNotify = (player, url, opts) =>
    model.byName[player].leader.notify(url, opts)

  return (
    <Row class='my-2'>
      <Col.Command>
        <Choice label='Notify' icon='bi-megaphone-fill'>
          {notifies.map(({ name, player, url, opts }) => (
            <Choice.Option
              key={name}
              label={name}
              onclick={() => doNotify(player, url, opts)}
            />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )
}
