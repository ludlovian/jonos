/** @jsx h */
import { h, Fragment } from 'preact'
import sortBy from '@ludlovian/sortby'

import { useModel } from '../model/index.mjs'
import { Media, Row, Col, Choice, Players } from '../components/index.mjs'

export function Group ({ leader: leaderName }) {
  const model = useModel()
  const leader = model.byName[leaderName]

  let players = [...leader.followers]
  players = players.sort(sortBy('fullName'))
  players = [...new Set([leader, ...players])]

  const followers = players.slice(1)
  const others = model.players
    .filter(p => p.leader !== leader)
    .sort(sortBy('fullName'))

  const commands = [
    ...followers.map(p => [`Remove: ${p.fullName}`, () => p.setLeader(p.name)]),
    ...others.map(p => [`Add: ${p.fullName}`, () => p.setLeader(leaderName)])
  ]

  const heading = (
    <Row class='pb-3'>
      <Col>
        <h4>{leader.fullName}</h4>
      </Col>
    </Row>
  )

  const choice = (
    <Row>
      <Col.Command>
        <Choice label='Group'>
          {commands.map(([label, onclick], ix) => (
            <Choice.Option key={ix} label={label} onclick={onclick} />
          ))}
        </Choice>
      </Col.Command>
    </Row>
  )

  return (
    <Fragment>
      {heading}
      <Media url={leader.mediaUrl} isPlaying={leader.isPlaying} />
      <Players players={players} editable />
      <hr />
      {choice}
    </Fragment>
  )
}
