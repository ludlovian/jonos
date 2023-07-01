import { html, useSignal } from './util.mjs'
import { post } from '../commands.mjs'

export function Button ({ prefix = '', label, cmd }) {
  const $busy = useSignal(false)
  const onclick = async () => {
    $busy.value = true
    await post(`/api/command/${cmd}`)
    $busy.value = false
  }

  return html`
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
      ${prefix + label}
    </button>
  `
}
