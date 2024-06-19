/** @jsx h */
import { h } from 'preact'
import { useSignal } from '@preact/signals'

import { useModel } from '../model/index.mjs'

export function CommandButton (props) {
  const model = useModel()
  const { prefix = '', label, url, redirect, data, ...rest } = props

  const $busy = useSignal(false)
  const onClick = async () => {
    $busy.value = true
    await model.postCommand(url, data)
    $busy.value = false
    if (redirect) model.router.route(redirect)
  }

  const spinner = <span class='spinner-border spinner-border-sm' />

  return (
    <button
      class='btn btn-primary'
      type='submit'
      onClick={onClick}
      disabled={$busy.value}
      {...rest}
    >
      {$busy.value && spinner}
      {prefix + label}
    </button>
  )
}
