/** @jsx h */
import { h, toChildArray, cloneElement } from 'preact'
import { useSignal } from '@preact/signals'

export function MultiButton ({ label, children, ...props }) {
  const $current = useSignal(0)
  const ix = $current.value

  label = label.replace(/: *$/, '')

  const buttons = toChildArray(children)
  const optionLabels = buttons.map(btn => btn.props.label)
  const oninput = e => ($current.value = e.target.value)
  const options = optionLabels.map((txt, ix) => (
    <option key={ix} value={ix} selected={ix === $current.value}>
      {txt}
    </option>
  ))
  const select = (
    <select class='form-select' oninput={oninput}>
      {options}
    </select>
  )
  const button = cloneElement(buttons[ix], { label, ...props })

  return (
    <div class='row'>
      <div class='col-6'>
        <div class='input-group mb-3'>
          {select}
          {button}
        </div>
      </div>
    </div>
  )
}

export function MultiButton2 ({ label: prefix = '', children, ...props }) {
  const $current = useSignal(0)
  const buttons = toChildArray(children)
  const currentButton = cloneElement(buttons[$current.value], {
    prefix,
    ...props
  })
  const buttonList = buttons.map((btn, index) => {
    const onClick = () => ($current.value = index)
    const { label } = btn.props
    return (
      <li key={index}>
        <a class='dropdown-item' onClick={onClick}>
          {label}
        </a>
      </li>
    )
  })

  return (
    <div class='row my-2'>
      <div class='col'>
        <div class='btn-group'>
          {currentButton}
          <button
            class='btn btn-primary dropdown-toggle dropdown-toggle-split'
            data-bs-toggle='dropdown'
            aria-expanded='false'
          >
            <span class='visually-hidden'>Toggle Dropdown</span>
          </button>
          <ul class='dropdown-menu'>{buttonList}</ul>
        </div>
      </div>
    </div>
  )
}
