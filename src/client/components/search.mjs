/** @jsx h */
import { h, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import Bouncer from '@ludlovian/bouncer'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'
import { Media } from './media.mjs'
import { Button } from './button.mjs'
import { useModel } from './use.mjs'

// Shows a search box and gets search results

// Required props
//
// - $results     - a signal that will be set with the array of items found

// Search

export function Search ({ $results }) {
  const model = useModel()
  const $text = useSignal('')
  const makeSearchBouncer = () =>
    new Bouncer({
      after: config.searchThrottle,
      fn: async () => ($results.value = await model.search($text.value))
    })
  const [sendSearch] = useState(makeSearchBouncer, [])

  const oninput = e => {
    $text.value = e.target.value
    sendSearch.fire()
  }

  return (
    <Row>
      <Col.Command>
        <div class='input-group'>
          <span class='input-group-text'>Search</span>
          <input
            type='text'
            class='form-controls'
            value={$text.value}
            oninput={oninput}
          />
        </div>
      </Col.Command>
    </Row>
  )
}

export function SearchResult ({ url, player }) {
  const model = useModel()
  if (!model.library[url]) return null
  return (
    <Fragment>
      <Media url={url} />
      <AddToQueue url={url} player={player} />
    </Fragment>
  )
}

function AddToQueue ({ url, player }) {
  const item = player.library.media[url]
  const urls = item.tracks ? item.tracks.map(t => url) : [item.url]
  const catcher = player.model.catch
  const play = true
  const repeat = true
  const playClick = () => player.load(urls, { play, repeat }).catch(catcher)
  const addClick = () =>
    player.load(urls, { play, repeat, add: true }).catch(catcher)
  return (
    <Row class='justofy-content-end mb-2'>
      <Col class='col-auto'>
        <Button icon='bi-play-fill' label='Play' onclick={playClick} />
      </Col>
      <Col>
        <Button icon='bi-plus-circle-fill' label='Add' onclick={addClick} />
      </Col>
    </Row>
  )
}
