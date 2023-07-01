import sortBy from 'sortby'
import { html } from './util.mjs'
import { Player } from './Player.mjs'
import { NowPlaying } from './NowPlaying.mjs'

export function Group ({ leader, members }) {
  // reorder members to have controller at the front
  members = members.sort(sortBy(p => p.fullName))
  members = [...new Set([leader, ...members])]

  return html`
    <${NowPlaying} player=${leader} />
    ${members.map(
      member => html`
        <${Player} player=${member} />
      `
    )}
    <hr />
  `
}
