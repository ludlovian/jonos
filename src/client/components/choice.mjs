/** @jsx h */
import { h, toChildArray } from 'preact'
import { useSignal, batch } from '@preact/signals'
import clsx from 'clsx/lite'

// Choice is a select + button combo
//
// Choice has:
// - label      for the button
// - class      additional prop for the input group
// Additional props are passed to the button
//
// Choice.Option has:
// - label      for the select option
// - onclick    to run when the button is clicked
//

export function Choice (props) {
  const { label, class: klass, children, ...rest } = props
  const $current = useSignal(0)
  const $busy = useSignal(false)

  const choices = toChildArray(children)

  return (
    <div class={clsx(klass, 'input-group')}>
      <ChoiceSelect choices={choices} $current={$current} $busy={$busy} />
      <ChoiceButton
        label={label}
        choices={choices}
        $current={$current}
        $busy={$busy}
        {...rest}
      />
    </div>
  )
}

function ChoiceSelect ({ choices, $current, $busy }) {
  const disabled = $busy.value || !choices.length
  const options = choices.map((choice, ix) => (
    <option key={ix} value={ix} selected={ix === $current.value}>
      {choice.props.label}
    </option>
  ))

  if (!options.length) options.push(<option> </option>)

  const oninput = e => ($current.value = +e.target.value)

  return (
    <select
      class='form-select'
      oninput={!disabled && oninput}
      disabled={disabled}
    >
      {options}
    </select>
  )
}

function ChoiceButton (props) {
  const { label, choices, $current, $busy } = props

  const disabled = !choices.length || $busy.value
  const onclick = async () => {
    const fn = choices[$current.value]?.props?.onclick
    if (!fn) return
    $busy.value = true
    await fn()
    batch(() => {
      $busy.value = false
      $current.value = 0
    })
  }

  const spinner = <span class='spinner-border spinner-border-sm' />

  return (
    <button
      class='btn btn-outline-secondary'
      type='button'
      onclick={!disabled && onclick}
      disabled={disabled}
    >
      {$busy.value && spinner}
      {label}
    </button>
  )
}

Choice.Option = function ChoiceOption (props) {
  // never gets rendered, but simply a placeholder for label/onclick
  return null
}
