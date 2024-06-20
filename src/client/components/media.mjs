/** @jsx h */
import { h, Fragment } from 'preact'
import clsx from 'clsx/lite'

import { useModel } from './use.mjs'
import { Row, Col } from './layout.mjs'
import { PlayerControl } from './player.mjs'

// displays the current media
// with an image and the track/title etc
//
// If supplied, also shows the tracks (details)
//
// Mandatory props
// url      - url of the media to show
//
// Optional props:
//
// player       - the player, from which we infer
//                - an indicator of whether playing
//                - play controls (see showControls)
//
// showControls - show the play/pause controls for the given player
//
// details      - for albums only, this is the list of tracks
//                (also highlights the current track if player given)
//
//

export function Media ({ url, player, showControls, details }) {
  const { library } = useModel()
  const item = url && library.media[url]
  if (url && !item) return null // shouldnt happen now

  return (
    <Row class='row pb-2'>
      <Col.Art class='position-relative'>
        {url ? <MediaArt url={url} /> : ' '}
        {player && player.isPlaying && <IsPlaying />}
      </Col.Art>
      <Col class='mb-3'>
        <MediaSummary
          item={item}
          details={details}
          hilite={player && details && player.mediaUrl}
        />
        {player && showControls && <PlayerControl player={player} />}
      </Col>
    </Row>
  )
}

function MediaArt ({ url }) {
  if (!url) return <div> </div>
  const imgUrl = `/art/${encodeURIComponent(url)}`
  return <img src={imgUrl} class='img-fluid media-art' />
}

function IsPlaying () {
  const cls = clsx(
    // position
    'position-absolute top-0 start-100 translate-middle',
    // padding
    'p-2',
    // green dot
    'bg-success border border-light rounded-circle'
  )
  return <span class={cls} />
}

function MediaSummary ({ item, details, hilite }) {
  const [a, b, c] = getSummaryLines(item ?? {})

  return (
    <Fragment>
      <div class='fw-bold'>{a ?? ''}</div>
      <div>{b ?? ''}</div>
      <div class='fst-italic'>{c ?? ''}</div>
      {details && <MediaDetails details={details} hilite={hilite} />}
    </Fragment>
  )
}

function MediaDetails ({ details, hilite }) {
  const items = details.map(item => {
    const title =
      item.index === undefined ? item.title : `${item.index + 1}. ${item.title}`
    return [title, item.url === hilite]
  })

  return (
    <ul class='small'>
      {items.map(([text, hilite], ix) => (
        <li key={ix} class={hilite && 'fw-bold'}>
          {text}
        </li>
      ))}
    </ul>
  )
}

function getSummaryLines (item) {
  const model = useModel()
  const { url, type, album, title, artist } = item
  if (type === 'track') return [album.artist, album.title, title]
  if (type === 'album') return [artist, title, '']
  if (type === 'tv') return ['', 'TV', '']
  if (type === 'web') return ['', 'Web', '']
  if (type === 'radio') {
    const now = model.library.nowPlaying[url]
    return [title, 'Radio', now ?? '']
  }
  return ['', 'No media loaded', '']
}
