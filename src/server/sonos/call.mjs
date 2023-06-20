import { get, post } from 'httpie'
import Debug from '@ludlovian/debug'
import Parsley from 'parsley'
import createSerial from 'pixutil/serial'

import { until } from '../model/signal-extra.mjs'
import { parseResponse, parseDescription } from './parse.mjs'
import { sonosCallAttempts, sonosCallDelay } from '../config.mjs'

const h = Parsley.create
const debug = Debug('jonos:sonos')
const debugError = Debug('jonos:error*')

const XML_PI = '<?xml version="1.0" encoding="utf-8"?>'
const serialByAddr = {}

export async function callSOAP (addr, srv, action, params = {}, opts = {}) {
  debug('call %s %s %o', addr, action, params)
  const { parse = true, verify } = opts
  const call = prepareCall(addr, srv, action, params)
  const { serial, url, headers, body } = call

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
  }

  debugError('call %s %s %o failed after several tries', addr, action, params)
}

function prepareCall (addr, srv, action, params) {
  const { service, path } = srv
  const url = `http://${addr}:1400/${path}/Control`
  const headers = {
    soapaction: `"urn:schemas-upnp-org:service:${service}:1#${action}"`,
    'Content-Type': 'text/xml; charset="utf-8"'
  }
  const actionElement = makeAction(service, action, params)
  const wrappedAction = addEnvelope(actionElement)
  const body = XML_PI + wrappedAction.xml()
  const serial = serialByAddr[addr] || (serialByAddr[addr] = createSerial())

  return { serial, url, headers, body }
}

export async function getDescription (addr) {
  debug('getDescription %s', addr)
  const url = `http://${addr}:1400/xml/device_description.xml`

  const res = await get(url)

  const parsed = parseDescription(res.data)
  if (!parsed) {
    debugError('not parsed')
    debugError(res.data.replaceAll('<', '\n<').replaceAll('&lt;', '\n  &lt;'))
  }
  return parsed
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
