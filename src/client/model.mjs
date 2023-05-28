import { signal, batch, computed } from './imports.mjs'
import { presets, notifies } from './config.mjs'

export const $players = signal({})
export const $groups = signal({})
export const $status = signal({})
export const $error = signal()

export const $isLoading = computed(
  () => Object.keys($players.value).length === 0
)
export const $isError = computed(() => !!$error.value)

window.$status = $status

const watchItems = [
  ['players', $players],
  ['groups', $groups],
  ['status', $status]
]

const es = new window.EventSource('/status/updates')
es.onmessage = ({ data }) =>
  batch(() => {
    const state = JSON.parse(data)
    for (const [item, $sig] of watchItems) {
      if (state[item]) $sig.value = state[item]
    }
  })

export async function applyPreset (preset) {
  try {
    for (const { url, body } of presets[preset]) {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }
  } catch (err) {
    $error.value = err
  }
}

export async function runNotify (notify) {
  const { url, body } = notifies[notify]
  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  } catch (err) {
    $error.value = err
  }
}
