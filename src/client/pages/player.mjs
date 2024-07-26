/** @jsx h */
import { h, Fragment } from 'preact'
import { useSignal } from '@preact/signals'
import sortBy from '@ludlovian/sortby'

import {
  useModel,
  Redirect,
  Media,
  Row,
  Col,
  Choice,
  Players,
  PlayerControl,
  Toggle,
  Search,
  SearchResult
} from '../components/index.mjs'

export function PlayerSummary ({ name }) {
  const model = useModel()
  const player = model.byName[name]
  if (!player) return model.catch(new Error(`Not a player: ${name}`))
  if (!player.isLeader) return <Redirect url='/' />

  return (
    <Fragment>
      <PlayerTitle player={player} />
      <SummaryQueue player={player} />
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

function SummaryQueue ({ player }) {
  if (!player.hasQueue) {
    return (
      <Media media={player.current} player={player}>
        <PlayerControl player={player} />
      </Media>
    )
  }
  return (
    <Fragment>
      {player.groupedQueue.map(({ media, tracks, isCurrent }) => (
        <Media
          key={media.id}
          media={media}
          asAlbum={!isCurrent}
          tracks={tracks}
          player={isCurrent && player}
        >
          {isCurrent && <PlayerControl player={player} />}
        </Media>
      ))}
    </Fragment>
  )
}

function PlayerMembers ({ player }) {
  const $editable = useSignal(false)
  const players = player.members
  const showGroup = players.length > 1

  return (
    <Fragment>
      <Toggle $signal={$editable}>
        <Players
          players={players}
          showGroup={showGroup}
          editable={$editable.value}
        />
      </Toggle>
      <GroupCommands player={player} />
    </Fragment>
  )
}

function GroupCommands ({ player }) {
  const $isAdd = useSignal(false)

  const removes = player.followers.map(p => [
    `Remove ${p.fullName}`,
    () => p.setLeader(p.name),
    false
  ])
  const adds = player.model.players
    .filter(p => p.leader !== player)
    .sort(sortBy('fullName'))
    .map(p => [`Add ${p.fullName}`, () => p.setLeader(player.name), true])

  return (
    <Row class='my-2'>
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
      {$results.value.map(item => (
        <SearchResult key={item.url} media={item} player={player} />
      ))}
    </Fragment>
  )
}
