import { html } from './util.mjs'

export function NowPlaying ({ player }) {
  const [who, what, title] = player.trackDetails

  return html`
    <div class="row pb-2">
      ${who &&
        html`
          <div class="fw-bold">${who}</div>
        `}
      ${what &&
        html`
          <div>${what}</div>
        `}
      ${title &&
        html`
          <div class="fst-italic">${title}</div>
        `}
    </div>
  `
}
