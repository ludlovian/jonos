import model from '../model.mjs'
import { html } from './util.mjs'
import { Groups } from './Groups.mjs'
import { MultiButton } from './MultiButton.mjs'
import { Button } from './Button.mjs'

export function App () {
  if (model.error) {
    return html`
      <${AppError} error=${model.error} />
    `
  }
  if (model.isLoading) {
    return html`
      <h1>Loading...</h1>
    `
  }

  return html`
    <div class="container">
      <p class="text">
        <span class="h3">Sonos Status</span>
        <small class="text mx-2">version ${model.version}</small>
      </p>
      <${Groups} groups=${model.groups} />
      <${PresetButtons} />
      <${NotifyButtons} />
    </div>
  `
}

function PresetButtons () {
  // prettier-ignore
  return html`
    <${MultiButton} label="Preset: ">
      <${Button} label="Standard" cmd="preset/standard" />
      <${Button} label="Zoom" cmd="preset/zoom" />
      <${Button} label="Guests" cmd="preset/guests" />
    </>
  `
}

function NotifyButtons () {
  // prettier-ignore
  return html`
    <${MultiButton} label="Notify: ">
      <${Button} label="Come Downstairs" cmd="notify/downstairs" />
      <${Button} label="Feed Me" cmd="notify/feedme" />
      ${model.isDev &&
        html`
          <${Button} label="Test" cmd="notify/test" />
      `}
    </>
  `
}

function AppError ({ error }) {
  return html`
    <div class="container">
      <h1>Error!</h1>
      ${error.message}
      <pre>${error.stack || ''}</pre>
    </div>
  `
}
