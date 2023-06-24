import { effect } from '@preact/signals-core'
import Debug from '@ludlovian/debug'
import Timer from 'timer'

import Players from './players.mjs'
import subscribe from './subscribe.mjs'
import { addSignals } from './signal-extra.mjs'
import { sonosLastListenerDelay, sonosResetPeriod, isDev } from '../config.mjs'

class Model {
  debug = Debug('jonos:model')

  constructor () {
    this.players = new Players()
    addSignals(this, {
      // core
      version: process.env.npm_package_version || 'dev',
      started: new Date(),
      listeners: 0,

      // derived
      state: () => ({
        server: {
          isDev,
          version: this.version,
          started: this.started
        },
        players: this.players.state
      })
    })

    this.tmReset = new Timer()
  }

  _monitorSubscriptions () {
    if (this.listeners > 0 && !this.players.$isSubscribed.peek()) {
      this.debug('Subscribing to all')

      // TODO need to wrap this async for errors
      this.players.subscribe()
    } else if (this.listeners === 0 && this.players.$isSubscribed.peek()) {
      this.debug('No listeners. Waiting a bit')

      const tm = new Timer({
        after: sonosLastListenerDelay,
        fn: () => {
          this.debug('Unsubscribing whilst idle')

          // TODO need to wrap this async for errors
          this.players.unsubscribe()
        }
      })
      return () => tm.cancel()
    }
  }

  async start () {
    await this.players.start()
    this.tmReset.set({
      every: sonosResetPeriod,
      fn: () => {
        this.debug('Resetting all players')
        this.reset()
      }
    })
    effect(() => this._monitorSubscriptions())
  }

  stop () {
    this.players.unsubscribe()
    this.tmReset.cancel()
  }

  reset () {
    this.players.reset()
  }

  listen (callback) {
    this.debug('listener added')
    this.listeners++
    const unsub = subscribe(() => this.state, callback)

    return () => {
      this.debug('listener removed')
      unsub()
      this.listeners--
    }
  }
}

const model = new Model()
if (isDev) global.model = model
export default model
