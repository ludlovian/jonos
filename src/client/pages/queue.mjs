/** @jsx h */
import { h, Fragment } from 'preact'

import { Media, Row, Col, useData } from '../components/index.mjs'

Queue.Async = function QueueAsync ({ player }) {
  const data = useData(() => player.getQueue(), [player])
  if (!data) return null
  return <Queue player={player} {...data} />
}

export function Queue ({ player, items }) {
  return (
    <Fragment>
      <QueueTitle player={player} />
      <StructuredQueue queue={items} url={player.mediaUrl} />
      <hr />
    </Fragment>
  )
}

function QueueTitle ({ player }) {
  return (
    <Row class='pb-3'>
      <Col>
        <h4>{player.fullName}</h4>
      </Col>
    </Row>
  )
}

function StructuredQueue ({ queue, url: currentUrl }) {
  queue = aggregate(queue)

  return (
    <Fragment>
      {queue.map((item, ix) => (
        <Fragment key={ix}>
          {!!ix && <hr />}
          <Media url={item.url} details={item.tracks} hilite={currentUrl} />
        </Fragment>
      ))}
    </Fragment>
  )

  function aggregate (items) {
    let currAlbum
    const result = []
    for (const item of items) {
      if (item.type !== 'track') {
        result.push(item)
      } else {
        if (item.album.url !== currAlbum?.url) {
          currAlbum = { ...item.album, tracks: [item] }
          result.push(currAlbum)
        } else {
          currAlbum.tracks.push(item)
        }
      }
    }
    return result
  }
}
