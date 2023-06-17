import { get, post } from 'httpie'
import Debug from 'debug'

import Parsley from 'parsley'

import { parseResponse, parseDescription } from './parse.mjs'

const h = Parsley.create
const debug = Debug('jonos:sonos')

const XML_PI = '<?xml version="1.0" encoding="utf-8"?>'

export async function callSOAP (addr, srv, action, params = {}, parse = true) {
  debug('call %s %s %o', addr, action, params)

  const { service, path } = srv
  const url = `http://${addr}:1400/${path}/Control`
  const headers = {
    soapaction: `"urn:schemas-upnp-org:service:${service}:1#${action}"`,
    'Content-Type': 'text/xml; charset="utf-8"'
  }
  const actionElement = makeAction(service, action, params)
  const wrappedAction = addEnvelope(actionElement)
  const body = XML_PI + wrappedAction.xml()

  const res = await post(url, { headers, body })

  const parsed = parse ? parseResponse(action, res.data) : undefined
  if (!parsed) {
    debug('not parsed')
    debug(res.data.replaceAll('<', '\n<').replaceAll('&lt;', '  &lt;'))
  }
  return parsed
}

export async function getDescription (addr) {
  debug('getDescription %s', addr)
  const url = `http://${addr}:1400/xml/device_description.xml`

  const res = await get(url)

  const parsed = parseDescription(res.data)
  if (!parsed) {
    debug('not parsed')
    debug(res.data.replaceAll('<', '\n<').replaceAll('&lt;', '  &lt;'))
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
