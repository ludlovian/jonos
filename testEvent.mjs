import os from 'node:os'
import process from 'node:process'
import { send } from 'httpie'
import polka from 'polka'

import { parseEvent } from './src/server/sonos/parse.mjs'

const myIP = getMyIP()
const [ip, service, path] = process.argv.slice(2)

console.log({ ip, service, path, myIP })

function getMyIP () {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(({ family, internal }) => family === 'IPv4' && !internal).address
}

let sid

async function subscribe () {
  const url = `http://${ip}:1400/${path}/Event`
  const headers = {
    callback: `<http://${myIP}:3501/${service}>`,
    NT: 'upnp:event',
    Timeout: 'Second-300'
  }
  const res = await send('SUBSCRIBE', url, { headers })
  sid = res.headers.sid
  console.log(`Subscribed to ${service}\nSID: ${sid}`)
}

async function unsubscribe () {
  const url = `http://${ip}:1400/${path}/Event`
  await send('UNSUBSCRIBE', url, { headers: { sid } })
  console.log('Unsubcribed')
}

function startServer () {
  return new Promise(resolve => {
    polka()
      .use(collectBody, parseResponse)
      .listen(3501, '0.0.0.0', () => {
        console.log('Listening on 3501')
        resolve()
      })
  })
}

async function collectBody (req, res, next) {
  req.setEncoding('utf-8')
  let data = ''
  for await (const chunk of req) data += chunk
  req.body = data
  next()
}

function parseResponse (req, res) {
  console.log(`\n---\n${req.method} ${req.path}`)
  res.writeHead(200).end()
  console.log(parseEvent(service, req.body) || fancy(req.body))
  // console.log(fancy(req.body))
}

function fancy (xml) {
  return xml.replaceAll('<', '\n<').replaceAll('&lt;', '\n  &lt;')
}

async function main () {
  await startServer()
  process.on('SIGINT', () => unsubscribe().then(() => process.exit()))
  await subscribe()
}

main()
