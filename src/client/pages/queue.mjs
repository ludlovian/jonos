/** @jsx h */
import { h, Fragment } from 'preact'
import { useSignal } from '@preact/signals'
import sortBy from '@ludlovian/sortby'

import { useData } from './util.mjs'
import { useModel } from '../model/index.mjs'
import { Media, Row, Col, Choice, Players } from '../components/index.mjs'

export function Queue ({ leader: leaderName }) {
  const queue = useData()
  if (!queue) return null
  const { items } = queue

  const model = useModel()
  const leader = model.byName[leaderName]

  return (
    <Fragment>
      <QueueTitle player={leader} />
      <StructuredQueue queue={items} url={leader.mediaUrl} />
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
