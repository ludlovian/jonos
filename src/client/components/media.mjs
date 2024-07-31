/** @jsx h */
import { h, Fragment } from 'preact'
import clsx from 'clsx/lite'

import { Row, Col } from './layout.mjs'

// A flexible Media control
//
// It can show
// -  any playable media item (with a playing indicator)
// -  an album, with/without track detail
//
//  Required props
//
//  - media     the media metadata object. The "type" property
//              drives other behaviours
//
//  Optional props
//
//  - player    if given, will show an isPlaying indicator if this
//              is the current media item, and the player is playing
//
//  - asAlbum   treat the given media item as representative of the
//              parent album
//
//  - tracks    show the tracks underneath
//
//
//  Any children (eg player control buttons) are shown under the banner
//

export function Media (props) {
  const { media, player, children, ...rest } = props
  if (!media) return null
  const isPlaying = player && !!player.playing && player.media?.id === media.id

  return (
    <Row class='row pb-2'>
      <Col.Art class='position-relative'>
        <MediaArt media={media} />
        {isPlaying && <IsPlaying />}
      </Col.Art>
      <Col class='mb-3'>
        <MediaBanner {...{ media, player, ...rest }} />
        {children}
      </Col>
    </Row>
  )
}

function MediaBanner (props) {
  const { media, player, asAlbum, ...rest } = props
  if (!media) return <NoMedia />
  const { type } = media
  if (type === 'tv') return <TVMedia />
  if (type === 'radio') {
    return <Radio media={media} nowStream={player?.nowStream} />
  }
  if (type === 'web') return <WebStream media={media} />
  if (type === 'track') {
    if (asAlbum) return <Album media={media} {...rest} />
    return <Track media={media} player={player} {...rest} />
  }
  return <NoMedia />
}

function ThreeLines ({ lines }) {
  return (
    <Fragment>
      <div class='fw-bold'>{lines[0] || ' '}</div>
      <div>{lines[1] || ' '}</div>
      <div class='fst-italic'>{lines[2] || ' '}</div>
    </Fragment>
  )
}

function NoMedia () {
  return <ThreeLines lines={['', 'No media loaded']} />
}

function TVMedia () {
  return <ThreeLines lines={['', 'TV']} />
}

function Radio ({ media, nowStream }) {
  const { title } = media
  return <ThreeLines lines={[title, 'Radio', nowStream]} />
}

function WebStream ({ media }) {
  const title = media.url.replace(/.*\//, '')
  return <ThreeLines lines={['', 'Web', title]} />
}

function Track (props) {
  const { media, tracks, ...rest } = props
  const { albumArtist, album, title } = media
  return (
    <Fragment>
      <ThreeLines lines={[albumArtist, album, title]} />
      {tracks && <Tracks tracks={tracks} {...rest} />}
    </Fragment>
  )
}

function Album (props) {
  const { media, tracks, ...rest } = props
  const { albumArtist, album } = media
  return (
    <Fragment>
      <ThreeLines lines={[albumArtist, album]} />
      {tracks && <Tracks tracks={tracks} {...rest} />}
    </Fragment>
  )
}

function Tracks (props) {
  const { tracks, player } = props
  return (
    <Fragment>
      <TrackExpandButton id={tracks[0].id} />
      <TrackCollapseGroup
        id={tracks[0].id}
        tracks={tracks}
        current={player?.media}
        player={player}
      />
    </Fragment>
  )
}

function TrackExpandButton ({ id }) {
  return (
    <Row class='justify-content-start'>
      <Col class='col-auto'>
        <a
          href='#'
          class='text-decoration-none text-secondary'
          data-bs-toggle='collapse'
          data-bs-target={`#album-tracks-${id}`}
        >
          <i class='bi bi-three-dots' />
        </a>
      </Col>
    </Row>
  )
}

function TrackCollapseGroup (props) {
  const { id, current, tracks, ...rest } = props
  return (
    <div class='collapse' id={`album-tracks-${id}`}>
      <ul class='small'>
        {tracks.map(track => (
          <TrackTitle
            key={track.id}
            media={track}
            isCurrent={current && current.id === track.id}
            {...rest}
          />
        ))}
      </ul>
    </div>
  )
}

function TrackTitle ({ media, isCurrent }) {
  const text = `${media.seq + 1}. ${media.title}`
  const cls = isCurrent ? 'text-primary' : 'text-secondary'
  return <li class={cls}>{text}</li>
}

function MediaArt ({ media }) {
  const isValid = ['radio', 'track', 'tv', 'web'].includes(media?.type)
  if (!isValid) return <div> </div>
  const imgUrl = `/art/${media.id}`
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
