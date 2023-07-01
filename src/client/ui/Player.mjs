/** @jsx h */
import { h } from 'preact'

export function Player ({ player }) {
  const { fullName, volume } = player
  const playing = player.leader.isPlaying && !player.mute
  return (
    <div class='row'>
      <div class='col-4 col-sm-3 col-lg-2'>
        <PlayerName fullName={fullName} />
      </div>
      <div class='col col-1'>
        <Volume volume={volume} playing={playing} />
      </div>
    </div>
  )
}

export function PlayerName ({ fullName }) {
  return fullName
}

export function Volume ({ volume, playing }) {
  const volClass = `badge bg-${playing ? 'success' : 'secondary'}`

  return <span class={volClass}>{volume}</span>
}
