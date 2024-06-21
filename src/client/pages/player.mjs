/** @jsx h */
import { h, Fragment } from 'preact'
import { useSignal } from '@preact/signals'
import sortBy from '@ludlovian/sortby'

import {
  useModel,
  Media,
  Row,
  Col,
  Choice,
  Players,
  Toggle,
  Search,
  SearchResult
} from '../components/index.mjs'

export function PlayerSummary ({ name }) {
  const model = useModel()
  const player = model.byName[name]
  if (!model) return model.catch(new Error(`Not a player: ${name}`))
  if (!player.isLeader) {
    return model.catch(new Error(`Not a leader: ${player.name}`))
  }

  return (
    <Fragment>
      <PlayerTitle player={player} />
      <PlayerQueue player={player} />
      <hr />
      <PlayerMembers player={player} />
      <hr />
      <MediaSearch player={player} />
    </Fragment>
  )
}

function PlayerTitle ({ player }) {
  return (
    <Row class='pb-2'>
      <Col>
        <h4>{player.fullName}</h4>
      </Col>
    </Row>
  )
}

function PlayerQueue ({ player }) {
  const queue = player.queue
  if (!queue) return null
  return (
    <Fragment>
      {queue.map((item, ix) => (
        <Media
          key={item}
          url={item.url}
          player={player}
          showControls={ix === queue.length - 1}
          details={item.tracks}
        />
      ))}
    </Fragment>
  )
}

function PlayerMembers ({ player }) {
  const $editable = useSignal(false)
  const players = [
    ...new Set([player, ...[...player.followers].sort(sortBy('fullName'))])
  ]

  return (
    <Fragment>
      <Toggle $signal={$editable}>
        <Players players={players} editable={$editable.value} />
      </Toggle>
      <GroupCommands player={player} />
    </Fragment>
  )
}

function GroupCommands ({ player }) {
  const $isAdd = useSignal(false)

  const removes = player.followers
    .filter(p => p !== player)
    .sort(sortBy('fullName'))
    .map(p => [`Remove ${p.fullName}`, () => p.setLeader(p.name), false])
  const adds = player.model.players
    .filter(p => p.leader !== player)
    .sort(sortBy('fullName'))
    .map(p => [`Add ${p.fullName}`, () => p.setLeader(player.name), true])

  return (
    <Row>
      <Col.Command>
        <Choice
          label={$isAdd.value ? 'Add to Group' : 'Remove from Group'}
          icon={$isAdd.value ? 'bi-plus-circle' : 'bi-dash-circle'}
          $current={$isAdd}
        >
          {[...adds, ...removes].map(([label, onclick, value]) => (
            <Choice.Option
              key={label}
              label={label}
              value={value}
              onclick={onclick}
            />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )
}

function MediaSearch ({ player }) {
  const $results = useSignal([])

  return (
    <Fragment>
      <Search $results={$results} />
      {$results.value.map(url => (
        <SearchResult key={url} url={url} player={player} />
      ))}
    </Fragment>
  )
}
