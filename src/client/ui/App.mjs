/** @jsx h */
import { h } from 'preact'

import model from '../model.mjs'
import { Groups } from './Groups.mjs'
import { MultiButton } from './MultiButton.mjs'
import { Button } from './Button.mjs'

export function App () {
  if (model.error) {
    return <AppError error={model.error} />
  }
  if (model.isLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <div class='container'>
      <p class='text'>
        <span class='h3'>Sonos Status</span>
        <small class='text mx-2'>version {model.version}</small>
      </p>
      <Groups groups={model.groups} />
      <PresetButtons />
      <NotifyButtons />
    </div>
  )
}

function PresetButtons () {
  return (
    <MultiButton label='Preset: '>
      <Button label='Standard' cmd='preset/standard' />
      <Button label='South' cmd='preset/south' />
      <Button label='Zoom' cmd='preset/zoom' />
      <Button label='Guests' cmd='preset/guests' />
    </MultiButton>
  )
}

function NotifyButtons () {
  return (
    <MultiButton label='Notify: '>
      <Button label='Come Downstairs' cmd='notify/downstairs' />
      <Button label='Feed Me' cmd='notify/feedme' />
      {model.isDev && <Button label='Test' cmd='notify/test' />}
    </MultiButton>
  )
}

function AppError ({ error }) {
  return (
    <div class='container'>
      <h1>Error!</h1>
      {error.message}
      <pre>{error.stack || ''}</pre>
    </div>
  )
}
