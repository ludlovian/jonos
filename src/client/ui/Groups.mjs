/** @jsx h */
import { h } from 'preact'

import { Group } from './Group.mjs'

export function Groups ({ groups }) {
  return groups.map(([leader, members]) => (
    <Group leader={leader} key={leader.name} members={members} />
  ))
}
