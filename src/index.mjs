import process from 'node:process'

import { players } from './server/model/index.mjs'
import { server } from './server/index.mjs'
server.start()

process.on('SIGINT', stop)

async function stop () {
  try {
    await players.unsubscribeAll()
    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
