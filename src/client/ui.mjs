import { h, html, useState, useCallback } from './imports.mjs'
import {
  $isLoading,
  $isError,
  $players,
  $groups,
  $status,
  $error,
  applyPreset,
  runNotify
} from './model.mjs'

export function App () {
  if ($isError.value) return h(AppError, { error: $error.value })
  if ($isLoading.value) return 'Loading...'
  return html`
    <div class="container">
      <h3>Sonos status</h3>
      <${Groups} />
      <${PresetButton} preset="standard" />
      <${NotifyButton} notify="downstairs" />
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
  return Object.keys($groups.value)
    .sort()
    .map(id => [id, $groups.value[id]])
    .map(([controller, members]) => h(Group, { controller, members }))
}

function Group ({ controller, members }) {
  // reorder members to have controller at the front
  members = [...new Set([controller, ...members])]
  const playing = $status.value[controller].playState === 'PLAYING'
  const items = members.map(id => h(Player, { id, playing }))
  return html`
    ${items}
    <hr />
  `
}

function Player ({ id, playing }) {
  const { name } = $players.value[id]
  const { volume } = $status.value[id]
  const a1 = { class: 'mx-1' }
  const a2 = {
    class: ['badge', 'bg-' + (playing ? 'success' : 'secondary'), 'mx-1'].join(
      ' '
    )
  }
  return html`
    <div class="row">
      <span class="text-secondary">
        <span ...${a1}>${name}</span>
        <span ...${a2}>${volume}</span>
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
  const action = useCallback(() => runNotify(notify), [notify])
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
