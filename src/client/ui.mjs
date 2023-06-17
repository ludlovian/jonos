import { h } from 'preact'
import htm from 'htm'
import { useState, useCallback } from 'preact/hooks'
import model from './model.mjs'
import { applyPreset, playNotify } from './commands.mjs'

const html = htm.bind(h)

export function App () {
  if (model.error) return h(AppError, { error: model.error })
  if (model.isLoading) return h('h1', {}, 'Loading...')
  return html`
    <div class="container">
      <h3>Sonos status</h3>
      <${Groups} />
      <${PresetButton} preset="standard" />
      <${NotifyButton} notify="${model.isTest ? 'test' : 'downstairs'}" />
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
  return Object.entries(model.groups).map(([leaderName, memberNames]) =>
    h(Group, { leaderName, memberNames })
  )
}

function Group ({ leaderName, memberNames }) {
  // reorder members to have controller at the front
  memberNames = [...new Set([leaderName, ...memberNames])]
  const leader = model.byName[leaderName]
  const playing = leader.isPlaying
  const title = playing ? leader.trackTitle : ''
  const items = memberNames.map(name =>
    h(Player, { name, playing, title: name === leaderName ? title : '' })
  )
  return html`
    ${items}
    <hr />
  `
}

function Player ({ name, playing, title }) {
  const player = model.byName[name]
  const { fullName, volume } = player
  const a1 = { class: 'mx-1' }
  const a2 = {
    class: ['badge', 'bg-' + (playing ? 'success' : 'secondary'), 'mx-1'].join(
      ' '
    )
  }
  const a3 = { class: 'mx-3' }
  return html`
    <div class="row">
      <span class="text-secondary">
        <span ...${a1}>${fullName}</span>
        <span ...${a2}>${volume}</span>
        ${title &&
          html`
            <span ...${a3}>${title}</span>
          `}
      </span>
    </div>
  `
}

function PresetButton ({ preset }) {
  const action = useCallback(() => applyPreset(preset), [preset])
  const label = `Preset - ${preset}`

  return h(Button, { label, action })
}

function NotifyButton ({ notify }) {
  const action = useCallback(() => playNotify(notify), [notify])
  const label = `Notify - ${notify}`

  return h(Button, { label, action })
}

function Button ({ label, action }) {
  const [busy, setBusy] = useState(false)
  const onclick = useCallback(async () => {
    setBusy(true)
    await action()
    setBusy(false)
  }, [action])

  const btnAttr = {
    class: 'btn btn-primary',
    type: 'submit',
    onclick,
    disabled: busy
  }
  const spinner =
    busy &&
    html`
      <span class="spinner-border spinner-border-sm" />
    `

  return html`
    <div class="row my-2">
      <div class="col">
        <button ...${btnAttr}>
          ${spinner} ${label}
        </button>
      </div>
    </div>
  `
}
