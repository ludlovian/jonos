/** @jsx h */
import { h, Fragment } from 'preact'
import sortBy from '@ludlovian/sortby'

import { useModel } from './util.mjs'
import { Media, Players, Link, PlayerControl } from '../components/index.mjs'

export function Home () {
  const model = useModel()

  const leaders = [...model.groups.keys()].sort(
    sortBy('isPlaying', 'desc').thenBy('name')
  )

  const groups = leaders.map(leader => (
    <Group key={leader.name} leader={leader} />
  ))

  return <Fragment>{groups}</Fragment>
}

function Group ({ leader }) {
  let players = [...leader.followers]
  players = players.sort(sortBy('fullName'))
  players = [...new Set([leader, ...players])]

  return (
    <Fragment>
      <Link href={`/group/${leader.name}/queue`}>
        <Media url={leader.mediaUrl} isPlaying={leader.isPlaying} />
      </Link>
      <PlayerControl player={leader} />
      <Link href={`/group/${leader.name}/members`}>
        <Players players={players} />
      </Link>
      <hr />
    </Fragment>
  )
}

/*
function PresetButtons () {
  return (
    <MultiButton label='Preset: '>
      <CommandButton label='Standard' url='/api/preset/standard' />
      <CommandButton label='South' url='/api/preset/south' />
      <CommandButton label='Zoom' url='/api/preset/zoom' />
      <CommandButton label='Guests' url='/api/preset/guests' />
    </MultiButton>
  )
}

function NotifyButtons () {
  const model = useModel()
  return (
    <MultiButton label='Notify: '>
      <CommandButton label='Come Downstairs' url='/api/notify/downstairs' />
      <CommandButton label='Feed Me' url='/api/notify/feedme' />
      {model.isDev && <CommandButton label='Test' url='/api/notify/test' />}
    </MultiButton>
  )
}
*/
