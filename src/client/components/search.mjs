/** @jsx h */
import { h, Fragment } from 'preact'
import { useSignal } from '@preact/signals'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'
import { Media } from './media.mjs'
import { Button } from './button.mjs'
import { useModel, useBouncer } from './use.mjs'

// Shows a search box and gets search results

// Required props
//
// - $results     - a signal that will be set with the array of items found

// Search

export function Search ({ $results }) {
  const model = useModel()
  const $text = useSignal('')
  const sendSearch = useBouncer({
    after: config.searchThrottle,
    fn: async () => ($results.value = await model.search($text.value))
  })

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

export function SearchResult ({ media, player }) {
  return (
    <Fragment>
      <Row class='mt-2'>
        <Media media={media} asAlbum />
      </Row>
      <AddToQueue url={media.url} player={player} />
    </Fragment>
  )
}

function AddToQueue ({ url, player }) {
  const catcher = player.model.catch
  const opts = { play: true, repeat: true }
  const add = true
  const playClick = () => player.load(url, opts).catch(catcher)
  const addClick = () => player.load(url, { ...opts, add }).catch(catcher)
  return (
    <Row class='justify-content-end mb-2'>
      <Col class='col-auto'>
        <div class='btn-group' role='group'>
          <Button icon='bi-play-fill' label='Play' onclick={playClick} />
          <Button icon='bi-plus-circle-fill' label='Add' onclick={addClick} />
        </div>
      </Col>
    </Row>
  )
}
