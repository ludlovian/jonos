/** @jsx h */
import { h } from 'preact'

import { Row, Col } from './layout.mjs'
import { Button } from './button.mjs'
import { Volume } from './volume.mjs'

export function PlayerControl ({ player }) {
  return (
    <Row class='justify-content-end mb-2'>
      <Col class='col-auto'>
        <div class='btn-group' role='group'>
          <Button
            icon='bi-play-fill'
            label='Play'
            onclick={() => player.play()}
            disabled={!player.isLeader || !player.mediaUrl || player.isPlaying}
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

export function Players ({ players, ...rest }) {
  return players.map(player => (
    <PlayerVolume key={player.name} player={player} {...rest} />
  ))
}

export function PlayerVolume ({ player, editable }) {
  const oninput = volume => player.setVolume(volume)
  const disabled = !editable

  return (
    <Volume
      label={player.fullName}
      volume={player.volume}
      oninput={editable ? oninput : undefined}
      disabled={disabled}
    />
  )
}
