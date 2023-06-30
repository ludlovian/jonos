// This file has all the communication with sonos players
//
// There are three types:
// - SOAP calls
// - XML description
// - Event subscription

import { get, post, send } from 'httpie'
import Debug from '@ludlovian/debug'
import Parsley from 'parsley'
import Serial from 'pixutil/serial'
import until from '@ludlovian/signal-extra/until'

import { parseResponse, parseDescription } from './parse.mjs'
import { sonosCallAttempts, sonosCallDelay } from '../config.mjs'

const h = Parsley.create
const debug = Debug('jonos:sonos')
const debugError = Debug('jonos:error*')

const XML_PI = '<?xml version="1.0" encoding="utf-8"?>'

// The main SOAP function
//
// If a (reactive) verify function is given in the options this will wait
// util the call is verified (e.g. we have received a notification), and
// will retry if this times out. This seems only to be needed if the Sonos
// has been deep asleep.

export async function callSOAP ({
  address,
  service,
  path,
  action,
  params = {},
  parse = true,
  verify
}) {
  debug('call %s %s %o', address, action, params)
  const { url, headers, body } = prepareCall({
    address,
    service,
    path,
    action,
    params
  })
  const serial = getSerial(address)

  for (let i = 0; i < sonosCallAttempts; i++) {
    const res = await serial.exec(() => post(url, { headers, body }))

    const parsed = parse ? parseResponse(action, res.data) : undefined
    if (!parsed) {
      debugError('not parsed')
      debugError(res.data.replaceAll('<', '\n<').replaceAll('&lt;', '  &lt;'))
      return
    }
    if (!verify) return parsed
    if (await until(verify, sonosCallDelay)) return parsed
    debug('Retrying call %s %s %o', address, action, params)
  }

  debugError(
    'call %s %s %o failed after several tries',
    address,
    action,
    params
  )
}

// The function to read the players XML description
//

export async function getDescription (addr) {
  debug('getDescription %s', addr)
  const url = `http://${addr}:1400/xml/device_description.xml`
  const serial = getSerial(addr)

  const res = await serial.exec(() => get(url))

  const parsed = parseDescription(res.data)
  if (!parsed) {
    debugError('not parsed')
    debugError(res.data.replaceAll('<', '\n<').replaceAll('&lt;', '\n  &lt;'))
  }
  return parsed
}

// The function to subscribe to a player & service
//

export async function subscribe (addr, path, headers) {
  const serial = getSerial(addr)
  const url = `http://${addr}:1400/${path}/Event`
  const res = await serial.exec(() => send('SUBSCRIBE', url, { headers }))
  return res.headers.sid
}

export async function unsubscribe (addr, path, headers) {
  const serial = getSerial(addr)
  const url = `http://${addr}:1400/${path}/Event`
  await serial.exec(() => send('UNSUBSCRIBE', url, { headers }))
}

// Utility functions to prepare the calls
//

// All communication with a particular sonos is serialised to stop
// confusing them!

const serialByAddr = new Map()

function getSerial (addr) {
  if (!serialByAddr.has(addr)) {
    serialByAddr.set(addr, new Serial())
  }
  return serialByAddr.get(addr)
}

function prepareCall ({ address, service, path, action, params }) {
  const url = `http://${address}:1400/${path}/Control`
  const headers = {
    soapaction: `"urn:schemas-upnp-org:service:${service}:1#${action}"`,
    'Content-Type': 'text/xml; charset="utf-8"'
  }
  const actionElement = makeAction(service, action, params)
  const wrappedAction = addEnvelope(actionElement)
  const body = XML_PI + wrappedAction.xml()

  return { url, headers, body }
}

function addEnvelope (elem) {
  const nsDefs = {
    'xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/',
    's:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/'
  }
  return h('s:Envelope', nsDefs).add(h('s:Body').add(elem))
}

function makeAction (service, action, params) {
  const ns = { 'xmlns:u': `urn:schemas-upnp-org:service:${service}:1` }
  const elem = h(`u:${action}`, ns)
  for (const [key, value] of Object.entries(params)) {
    elem.add(h(key).add(value.toString()))
  }
  return elem
}
