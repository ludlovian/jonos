/** @jsx h */
import { h } from 'preact'
import { Signal, useSignal } from '@preact/signals'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'
import { useBouncer } from './use.mjs'

// A player/group volume control
//
// Props:
//  label     - the name of the player/group
//  $volume   - the signal with the current volume
//  disabled  - stops input

export function Volume (props) {
  const { label, $volume, disabled } = props
  console.assert($volume instanceof Signal, $volume)

  const $volumeDisplay = useSignal(false)
  const hideVolume = useBouncer({
    after: config.volumeDisplayDelay,
    fn: () => ($volumeDisplay.value = false)
  })

  const oninput = e => {
    $volume.value = +e.target.value
    $volumeDisplay.value = true
    hideVolume.fire()
  }

  return (
    <Row>
      <Col.PlayerName>{label}</Col.PlayerName>
      <Col>
        <VolumeSlider
          volume={$volume.value}
          oninput={!disabled ? oninput : undefined}
          disabled={disabled}
        />
      </Col>
      <Col class='col-1'>
        {!disabled && $volumeDisplay.value && (
          <span class='small align-top'>{$volume}</span>
        )}
      </Col>
    </Row>
  )
}

function VolumeSlider ({ volume, oninput, disabled }) {
  const onclick = e => e.stopPropagation()
  return (
    <input
      type='range'
      class='volume-slider'
      value={volume}
      oninput={oninput}
      onclick={onclick}
      disabled={disabled}
    />
  )
}
