import process from 'node:process'
import model from './server/model/index.mjs'
import { server } from './server/index.mjs'

async function main () {
  server.start()
  await model.start()
  process.on('SIGINT', stop)
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

main()
