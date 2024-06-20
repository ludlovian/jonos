/** @jsx h */
import { h, toChildArray } from 'preact'
import { useSignal, useSignalEffect } from '@preact/signals'
import clsx from 'clsx/lite'

import { Button } from './button.mjs'

// Choice is a select + button combo
//
// Choice has:
// - label      for the button
// - class      additional prop for the input group
// - $current   (if supplied) a signal to be set to the 'value' of the
//              current option
//
// Additional props are passed to the button, e.g. icon, $busy
//
// Choice.Option has:
// - label      for the select option
// - onclick    to run when the button is clicked
// - value      to be passed back if $current supplied
//

export function Choice (props) {
  const {
    label,
    class: klass,
    children,
    $current: $parentCurrent,
    ...rest
  } = props
  const choices = toChildArray(children)
  const disabled = !choices.length

  const $current = useSignal(0)
  const $enabled = useSignal(!disabled)
  if ($parentCurrent) {
    useSignalEffect(() => {
      const ix = $current.value
      $parentCurrent.value = choices[ix].props.value
    })
  }

  const onclick = async () => {
    const fn = choices[$current.value]?.props?.onclick
    if (typeof fn !== 'function') return
    $enabled.value = false
    await fn()
    $enabled.value = true
    $current.value = 0
  }

  return (
    <div class={clsx(klass, 'input-group')}>
      <ChoiceSelect choices={choices} $current={$current} $enabled={$enabled} />
      <Button
        label={label}
        onclick={disabled ? undefined : onclick}
        disabled={disabled}
        {...rest}
      />
    </div>
  )
}

function ChoiceSelect ({ choices, $current, $enabled }) {
  const disabled = !$enabled.value
  const options = choices.map((choice, ix) => {
    const { icon, label } = choice.props
    return (
      <option key={ix} value={ix} selected={ix === $current.value}>
        {icon && <i class={clsx('bi', icon)} />}
        {label}
      </option>
    )
  })

  if (!options.length) options.push(<option> </option>)

  const oninput = e => ($current.value = +e.target.value)

  return (
    <select
      class='form-select'
      oninput={!disabled ? oninput : undefined}
      disabled={disabled}
    >
      {options}
    </select>
  )
}

Choice.Option = function ChoiceOption (props) {
  // never gets rendered, but simply a placeholder for label/onclick
  return null
}
