/** @jsx h */
import { h } from 'preact'
import { useSignal } from '@preact/signals'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'
import { useBouncer } from './use.mjs'

// A player/group volume control
//
// Props:
//  label     - the name of the player/group
//  volume    - the volume passed into the component
//  $volume   - a signal to be updated with the volume as changed
//  disabled  - stops input

export function Volume (props) {
  const { label, volume: inVolume, $volume: $outVolume, disabled } = props
  const $volume = useSignal(inVolume)
  const $volumeDisplay = useSignal(false)
  const sendUpdate = useBouncer({
    after: config.volumeThrottle,
    fn: () => ($outVolume.value = $volume.value)
  })
  const hideVolume = useBouncer({
    after: config.volumeDisplayDelay,
    fn: () => ($volumeDisplay.value = false)
  })

  const oninput = e => {
    $volume.value = +e.target.value
    $volumeDisplay.value = true
    sendUpdate.fire()
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
      {!disabled && (
        <Col class='col-1'>
          {$volumeDisplay.value && (
            <span class='small align-top'>{$volume}</span>
          )}
        </Col>
      )}
    </Row>
  )
}

function VolumeSlider ({ volume, oninput, disabled }) {
  return (
    <input
      type='range'
      class='volume-slider'
      value={volume}
      oninput={oninput}
      disabled={disabled}
    />
  )
}
