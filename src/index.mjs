import process from 'node:process'

import { effect } from '@preact/signals-core'

import Debug from '@ludlovian/debug'
import model from '@ludlovian/jonos-model'

import { server } from './server/index.mjs'

const debug = Debug('jonos:server')

async function main () {
  await model.start()
  debug('Model started')

  await server.start()

  reportListening()

  process.on('SIGINT', stop).on('SIGTERM', stop)
}

function reportListening () {
  if (!debug.enabled) return undefined
  let listening = false
  effect(() => {
    const wasListening = listening
    listening = model.players.someListening
    if (wasListening && !listening) {
      debug('Stopped listening')
    } else if (!wasListening && listening) {
      debug('Started listening')
    }
  })
}

async function stop () {
  try {
    await model.stop()
    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
