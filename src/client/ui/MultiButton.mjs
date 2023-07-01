import { html, toChildArray, cloneElement, useSignal } from './util.mjs'

export function MultiButton ({ label: prefix = '', children }) {
  const $current = useSignal(0)
  const buttons = toChildArray(children)

  return html`
    <div class="row my-2">
      <div class="col">
        <div class="btn-group">
          <${MBCurrent} ...${{ prefix, buttons, $current }} />
          <button
            class="btn btn-primary dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <span class="visually-hidden">Toggle Dropdown</span>
          </button>
          <ul class="dropdown-menu">
            <${MBList} ...${{ buttons, $current }} />
          </ul>
        </div>
      </div>
    </div>
  `
}

function MBCurrent ({ buttons, $current, prefix }) {
  return cloneElement(buttons[$current.value], { prefix })
}

function MBList ({ buttons, $current }) {
  return buttons
    .map(btn => btn.props.label)
    .map(
      (text, index) => html`
        <${MBChoice} ...${{ text, $current, index }} />
      `
    )
}

function MBChoice ({ text, index, $current }) {
  const onclick = () => ($current.value = index)
  return html`
    <li>
      <a class="dropdown-item" onclick=${onclick}>${text}</a>
    </li>
  `
}
