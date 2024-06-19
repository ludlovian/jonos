/** @jsx h */
import { h } from 'preact'
import { useSignal } from '@preact/signals'
import clsx from 'clsx/lite'

//
// Props:
//  enabled  - signal with the enabled value
//  onclick  - the (async) function to call when clicked
//  icon     - the icon to use
//  label    - the text

export function Button (props) {
  const $busy = useSignal(false)
  const disabled = !props.enabled || $busy.value
  const onclick = async e => {
    $busy.value = true
    props.onclick && (await props.onclick())
    $busy.value = false
  }
  const spinner = <span class='spinner-border spinner-border-sm' />
  const icon = props.icon && <i class={clsx('bi', props.icon)} />
  const cls = clsx(props.class, 'btn', 'btn-outline-secondary')

  return (
    <button
      class={cls}
      type='button'
      onclick={!disabled && onclick}
      disabled={disabled}
    >
      {$busy.value ? spinner : icon && icon}
      {props.label}
    </button>
  )
}
