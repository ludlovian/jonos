import { send } from 'httpie'
import { callSOAP, getDescription } from './src/server/sonos/call.mjs'

const [ip, action, service, path, ..._parms] = process.argv.slice(2)

const parms = Object.fromEntries(_parms.map(p => p.split('=')))
console.log({ ip, action, service, path, parms })


async function main () {
  let result
  if (action === 'getDescription') {
    result = await getDescription(ip)
  } else {
    result = await callSOAP(ip, { service, path }, action, parms, { parse: false })
  }
  console.log(result)
}

main()
/*
function decodeEntities (string) {
  const decodes = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&apos;': "'",
    '&quot;': '"'
  }
  return string.replace(/&(?:lt|gt|amp|apos|quot);/g, c => decodes[c])
}

function xmlParse (string) {
  const parser = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    attributeNamePrefix: ''
  })

  return parser.parse(string)
}

function xmlParseRecursive (obj) {
  if (typeof obj === 'string' && isXml(obj)) {
    return xmlParseRecursive(xmlParse(obj))
  }
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(clean)
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, clean(v)])
  )

  function isXml (s) {
    return s.startsWith('<') && s.endsWith('>')
  }
}

async function handleEvent (req, res) {
  const handlers = {
    ZoneGroupTopology: handleZoneGroupTopology
  }

  console.log(`\n---\n${req.method} ${req.url}`)
  const body = await collectBody(req)
  res.writeHead(200).end()
  const [service] = req.url.split('/').filter(Boolean)
  const fn = handlers[service]
  if (fn) return fn(body)
  console.log(body)
}

function handleZoneGroupTopology (xml) {
  const state = extractZoneGroupState(xml)
  parseZoneGroupState(state)

  function parseZoneGroupState (xml) {
    let leaderUuid
    const s = new Scrapie()
    s.when('ZoneGroup')
      .on('enter', ({ attrs }) => {
        leaderUuid = attrs.Coordinator
      })
      .when('ZoneGroupMember')
      .on('enter', ({ attrs }) => {
        const { UUID: uuid, Location: url, ZoneName: fullName } = attrs
        console.log({ fullName, uuid, url, leaderUuid })
      })
    s.write(xml)
  }

  function extractZoneGroupState (xml) {
    let ret
    const s = new Scrapie()
    s.when('ZoneGroupState').on('text', t => {
      ret = ret || decodeEntities(t)
    })
    s.write(xml)
    return ret
  }
}

*/
