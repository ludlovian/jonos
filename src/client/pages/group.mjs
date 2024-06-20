/** @jsx h */
import { h, Fragment } from 'preact'
import { useSignal } from '@preact/signals'
import sortBy from '@ludlovian/sortby'

import { Media, Row, Col, Choice, Players } from '../components/index.mjs'

export function Group ({ player: leader }) {
  if (!leader.isLeader) {
    leader.model.catch(new Error(`Not a leader: ${leader.name}`))
    return null
  }

  let players = [...leader.followers]
  players = players.sort(sortBy('fullName'))
  players = [...new Set([leader, ...players])]

  return (
    <Fragment>
      <GroupTitle leader={leader} />
      <Media url={leader.mediaUrl} isPlaying={leader.isPlaying} />
      <Players players={players} editable />
      <hr />
      <GroupCommands leader={leader} />
    </Fragment>
  )
}

function GroupTitle ({ leader }) {
  return (
    <Row class='pb-3'>
      <Col>
        <h4>{leader.fullName}</h4>
      </Col>
    </Row>
  )
}

function GroupCommands ({ leader }) {
  const $isAdd = useSignal(false)

  const followers = leader.followers
    .filter(p => p !== leader)
    .sort(sortBy('fullName'))

  const others = leader.model.players
    .filter(p => p.leader !== leader)
    .sort(sortBy('fullName'))

  const commands = [
    ...followers.map(p => [
      `Remove: ${p.fullName}`,
      () => p.setLeader(p.name),
      false // remove
    ]),
    ...others.map(p => [
      `Add: ${p.fullName}`,
      () => p.setLeader(leader.name),
      true // add
    ])
  ]

  return (
    <Row>
      <Col.Command>
        <Choice
          label={$isAdd.value ? 'Add to Group' : 'Remove from Group'}
          icon={$isAdd.value ? 'bi-plus-circle' : 'bi-dash-circle'}
          $current={$isAdd}
        >
          {commands.map(([label, onclick, value]) => (
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
