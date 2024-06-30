/** @jsx h */
import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import { useComputed, useSignal } from '@preact/signals'

import { Row, Col } from './layout.mjs'
import { Button } from './button.mjs'
import { Volume } from './volume.mjs'
import { useModel, useLinkSignals } from './use.mjs'

export function PlayerControl ({ player }) {
  return (
    <Row class='justify-content-end mb-2'>
      <Col class='col-auto'>
        <div class='btn-group' role='group'>
          <Button
            icon='bi-play-fill'
            label='Play'
            onclick={() => player.play()}
            disabled={!player.isLeader || !player.trackUrl || player.isPlaying}
          />
          <Button
            icon='bi-pause-fill'
            label='Pause'
            onclick={() => player.pause()}
            disabled={!player.isLeader || !player.isPlaying}
          />
        </div>
      </Col>
    </Row>
  )
}

export function Players ({ players, showGroup, ...rest }) {
  return (
    <div class='my-3'>
      {showGroup && <GroupVolume players={players} {...rest} />}
      {players.map(player => (
        <PlayerVolume key={player} player={player} {...rest} />
      ))}
    </div>
  )
}

export function GroupVolume ({ players, editable }) {
  const disabled = !editable
  const model = useModel()
  const $groupVol = useComputed(() =>
    Math.max(1, ...players.map(p => p.volume))
  )
  const getRatios = () => players.map(p => [p, p.volume / $groupVol.value])
  const ratios = useMemo(getRatios, [])

  const $volume = useSignal($groupVol.value)
  useLinkSignals(
    $groupVol,
    () => {
      if (model.error) return
      $volume.value = $groupVol.value
    },
    $volume,
    () => {
      if (model.error) return
      ratios.forEach(([p, ratio]) => {
        p.volume = Math.round($volume.value * ratio)
      })
    }
  )

  return (
    <div class='pb-3'>
      <Volume label='Group' $volume={$volume} disabled={disabled} />
    </div>
  )
}

export function PlayerVolume ({ player, editable }) {
  const disabled = !editable

  return (
    <Volume
      label={player.fullName}
      $volume={player.$volume}
      disabled={disabled}
    />
  )
}
