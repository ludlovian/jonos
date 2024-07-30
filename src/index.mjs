import process from 'node:process'

import Debug from '@ludlovian/debug'
import model from '@ludlovian/jonos-model'

import { server } from './server/index.mjs'

const debug = Debug('jonos:server')

async function main () {
  await model.start()
  debug('Model started')

  await server.start()

  model.onListening = reportListening

  process.on('SIGINT', stop).on('SIGTERM', stop)
}

function reportListening (listening) {
  if (listening) {
    debug('Started listening')
  } else {
    debug('Stopped listening')
  }
}

async function stop () {
  try {
    debug('Stopping...')
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
