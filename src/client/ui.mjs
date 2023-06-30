import { h } from 'preact'
import htm from 'htm'
import { useCallback } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import model from './model.mjs'
import { post } from './commands.mjs'

const html = htm.bind(h)

export function App () {
  if (model.error) {
    return html`
      <${AppError} error=${model.error} />
    `
  }
  if (model.isLoading) {
    return html`
      <h1>Loading...</h1>
    `
  }

  const presetButtons = [
    ['Standard', 'standard'],
    ['Zoom', 'zoom'],
    ['Guests', 'guests']
  ]

  const notifyButtons = [
    ['Come Downstairs', 'downstairs'],
    ['Feed Me', 'feedme'],
    model.isDev && ['Test', 'test']
  ].filter(Boolean)

  return html`
    <div class="container">
      <p class="text">
        <span class="h3">Sonos Status</span>
        <small class="text mx-2">version ${model.version}</small>
      </p>
      <${Groups} />
      <${MultiButton}
        prefix="Preset"
        buttons=${presetButtons}
        url="/api/command/preset/"
      />
      <hr />
      <${MultiButton}
        prefix="Notify"
        buttons=${notifyButtons}
        url="/api/command/notify/"
      />
    </div>
  `
}

export function AppError ({ error }) {
  return html`
    <div class="container">
      <h1>Error!</h1>
      ${error.message}
      <pre>${error.stack || ''}</pre>
    </div>
  `
}

function Groups () {
  return Object.entries(model.groups).map(
    ([leaderName, memberNames]) =>
      html`
        <${Group} leaderName=${leaderName} memberNames=${memberNames} />
      `
  )
}

function Group ({ leaderName, memberNames }) {
  // reorder members to have controller at the front
  memberNames = [...new Set([leaderName, ...memberNames])]
  const leader = model.byName[leaderName]

  return html`
    ${leader.isPlaying &&
      html`
        <${TrackDetails} trackDetails=${leader.trackDetails} />
      `}
    ${memberNames.map(
      name => html`
        <${Player} name=${name} playing=${leader.isPlaying} />
      `
    )}
    <hr />
  `
}

function TrackDetails ({ trackDetails }) {
  const [who, what, title] = trackDetails

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

function Player ({ name, playing }) {
  const player = model.byName[name]
  const { fullName, volume } = player
  const volClass = `badge bg-${
    playing && !player.mute ? 'success' : 'secondary'
  }`
  return html`
    <div class="row">
      <div class="col-4 col-sm-3 col-lg-2">
        ${fullName}
      </div>
      <div class="col col-1">
        <span class="${volClass}">${volume}</span>
      </div>
    </div>
  `
}

function MultiButton ({ prefix, buttons, url: urlPrefix }) {
  const $current = useSignal(0)
  const $busy = useSignal(false)
  const [text] = buttons[$current.value]
  const onclick = useCallback(async () => {
    const [, url] = buttons[$current.value]
    $busy.value = true
    await post(urlPrefix + url)
    $busy.value = false
  }, [])

  return html`
    <div class="row my-2">
      <div class="col">
        <div class="btn-group">
          <button
            class="btn btn-primary"
            type="submit"
            onclick=${onclick}
            disabled=${$busy.value}
          >
            ${$busy.value &&
              html`
                <span class="spinner-border spinner-border-sm" />
              `}
            ${prefix} - ${text}
          </button>
          <button
            class="btn btn-primary dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <span class="visually-hidden">Toggle Dropdown</span>
          </button>
          <ul class="dropdown-menu">
            ${buttons.map(
              ([text], index) => html`
                <${MultiButtonChoice}
                  text=${text}
                  index=${index}
                  $current=${$current}
                />
              `
            )}
          </ul>
        </div>
      </div>
    </div>
  `
}

function MultiButtonChoice ({ text, index, $current }) {
  const onclick = useCallback(() => ($current.value = index), [$current, index])
  return html`
    <li>
      <a class="dropdown-item" onclick=${onclick}>${text}</a>
    </li>
  `
}
