import { h } from 'preact'
import htm from 'htm'
import { useState, useCallback } from 'preact/hooks'
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
  return html`
    <div class="container">
      <p class="text">
        <span class="h3">Sonos Status</span>
        <small class="text mx-2">version ${model.version}</small>
      </p>
      <${Groups} />
      <${PresetButton} preset="standard" label="Standard" />
      <hr />
      ${model.isDev &&
        html`
          <${NotifyButton} notify="test" label="Test" />
        `}
      <${NotifyButton} notify="downstairs" label="Come Downstairs" />
      <${NotifyButton} notify="feedme" label="Feed Me" />
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

function PresetButton ({ preset, label }) {
  return html`
    <${Button}
      label=${`Preset - ${label}`}
      url=${`/api/command/preset/${preset}`}
    />
  `
}

function NotifyButton ({ notify, label }) {
  return html`
    <${Button}
      label=${`Notify - ${label}`}
      url=${`/api/command/notify/${notify}`}
    />
  `
}

function Button ({ label, url }) {
  const [busy, setBusy] = useState(false)
  const onclick = useCallback(async () => {
    setBusy(true)
    await post(url)
    setBusy(false)
  }, [url])

  return html`
    <div class="row my-2">
      <div class="col">
        <button
          class="btn btn-primary"
          type="submit"
          onclick=${onclick}
          disabled=${busy}
        >
          ${busy &&
            html`
              <span class="spinner-border spinner-border-sm" />
            `}
          ${label}
        </button>
      </div>
    </div>
  `
}
