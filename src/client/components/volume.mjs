/** @jsx h */
import { h } from 'preact'
import { useState } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import Bouncer from '@ludlovian/bouncer'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'

export function Volume (props) {
  const { label, volume, oninput: _oninput, disabled } = props
  const $volume = useSignal(volume)
  const $volumeDisplay = useSignal(false)

  const sendUpdate = useState(
    () =>
      new Bouncer({
        after: config.volumeThrottle,
        fn: () => _oninput($volume.value)
      }),
    [label, disabled]
  )[0]

  const hideVolume = useState(
    () =>
      new Bouncer({
        after: config.volumeDisplayDelay,
        fn: () => ($volumeDisplay.value = false)
      }),
    [label, disabled]
  )[0]

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
          oninput={!disabled && oninput}
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
