import Debug from '@ludlovian/debug'
import Timer from 'timer'
import Bouncer from 'bouncer'
import addSignals from '@ludlovian/signal-extra/add-signals'
import subscribe from '@ludlovian/signal-extra/subscribe'

import Players from './players.mjs'
import {
  sonosNotificationDelay,
  sonosResetPeriod,
  statusThrottle,
  isDev
} from '../config.mjs'

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

    this.unsubscriber = new Bouncer()
    this.tmReset = new Timer()
  }

  touch () {
    this.unsubscriber.fire()
    if (!this.players.isSubscribed) return this.players.subscribe()
  }

  async start () {
    await this.players.start()

    this.unsubscriber.set({
      after: sonosNotificationDelay,
      fn: () => {
        if (this.listeners) return this.touch()
        this.debug('Unsubscribing')
        this.players.unsubscribe()
      }
    })

    this.tmReset.set({
      every: sonosResetPeriod,
      fn: () => {
        if (!this.unsubscriber.active) {
          this.debug('Resetting all players')
          this.reset()
        }
      }
    })
  }

  stop () {
    this.unsubscriber.stop()
    this.tmReset.cancel()
    this.players.unsubscribe()
  }

  reset () {
    this.players.reset()
  }

  listen (callback) {
    this.debug('listener added')
    this.touch()
    this.listeners++
    const unsub = subscribe(() => this.state, callback, {
      debounce: statusThrottle
    })

    return () => {
      this.debug('listener removed')
      unsub()
      this.touch()
      this.listeners--
    }
  }
}

const model = new Model()
if (isDev) global.model = model
export default model
