/** @jsx h */
import { h, Fragment } from 'preact'
import sortBy from 'sortby'

import { Player } from './Player.mjs'
import { NowPlaying } from './NowPlaying.mjs'

export function Group ({ leader, members }) {
  // reorder members to have controller at the front
  members = members.sort(sortBy(p => p.fullName))
  members = [...new Set([leader, ...members])]

  return (
    <Fragment>
      <NowPlaying player={leader} />
      {members.map(member => (
        <Player player={member} key={member.name} />
      ))}
      <hr />
    </Fragment>
  )
}
