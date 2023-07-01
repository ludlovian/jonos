/** @jsx h */
import { h } from 'preact'

export function NowPlaying ({ player }) {
  const [who, what, title] = player.trackDetails

  return (
    <div class='row pb-2'>
      {who && <div class='fw-bold'>{who}</div>}
      {what && <div>{what}</div>}
      {title && <div class='fst-italic'>{title}</div>}
    </div>
  )
}
