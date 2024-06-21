/** @jsx h */
import { h, Fragment } from 'preact'
import sortBy from '@ludlovian/sortby'

import { Media, Players, Link, useModel } from '../components/index.mjs'

export function Home () {
  const model = useModel()

  const leaders = [...model.groups.keys()].sort(
    sortBy('isPlaying', 'desc').thenBy('name')
  )

  return (
    <Fragment>
      {leaders.map(player => (
        <GroupSummary key={player.name} player={player} />
      ))}
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
        <Media url={player.mediaUrl} player={player} />
        <Players players={players} />
      </Link>
      <hr />
    </Fragment>
  )
}
