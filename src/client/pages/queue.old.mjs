/** @jsx h */
import { h, Fragment } from 'preact'

import { Media, Row, Col } from '../components/index.mjs'

export function Queue ({ player }) {
  const { queue } = player
  if (!queue) return null

  return (
    <Fragment>
      <QueueTitle player={player} />
      {queue.map(item => (
        <Media
          key={item.url}
          url={item.url}
          details={item.tracks}
          player={player}
        />
      ))}
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
