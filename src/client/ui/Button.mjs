/** @jsx h */
import { h } from 'preact'
import { useSignal } from '@preact/signals'

import { post } from '../commands.mjs'

export function Button ({ prefix = '', label, cmd }) {
  const $busy = useSignal(false)
  const onclick = async () => {
    $busy.value = true
    await post(`/api/command/${cmd}`)
    $busy.value = false
  }

  return (
    <button
      class='btn btn-primary'
      type='submit'
      onclick={onclick}
      disabled={$busy.value}
    >
      {$busy.value && <span class='spinner-border spinner-border-sm' />}
      {prefix + label}
    </button>
  )
}
