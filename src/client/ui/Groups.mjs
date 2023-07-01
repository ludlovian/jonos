import { html } from './util.mjs'
import { Group } from './Group.mjs'

export function Groups ({ groups }) {
  return groups.map(
    ([leader, members]) => html`
      <${Group} ...${{ leader, members }} />
    `
  )
}
