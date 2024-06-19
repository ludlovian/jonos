/** @jsx h */
import { h } from 'preact'
import { useState } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import Bouncer from '@ludlovian/bouncer'

import config from '../config.mjs'
import { Row, Col } from './layout.mjs'
import { useModel } from '../model/index.mjs'

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
