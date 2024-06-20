/** @jsx h */
import { h } from 'preact'
import { useSignal, useSignalEffect } from '@preact/signals'
import clsx from 'clsx/lite'

//
// Props:
//  disabled
//  onclick  - the (async) function to call when clicked
//  icon     - the icon to use
//  label    - the text
//  $busy    - (optional) a signal to be updated when busy

export function Button (props) {
  const $busy = useSignal(false)
  const disabled = !!props.disabled || $busy.value
  if (props.$busy) useSignalEffect(() => (props.$busy.value = $busy.value))

  const onclick = async e => {
    $busy.value = true
    props.onclick && (await props.onclick())
    $busy.value = false
  }
  const spinner = <span class='spinner-border spinner-border-sm' />
  const icon = props.icon && <i class={clsx('bi', props.icon, 'me-2')} />
  const cls = clsx(props.class, 'btn', 'btn-outline-secondary')

  return (
    <button
      class={cls}
      type='button'
      onclick={!disabled ? onclick : undefined}
      disabled={disabled}
    >
      {$busy.value ? spinner : icon && icon}
      {props.label}
    </button>
  )
}
