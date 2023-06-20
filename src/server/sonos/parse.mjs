import Debug from '@ludlovian/debug'

import Parsley from 'parsley'

const debug = Debug('jonos:sonos')

export function parseResponse (action, xml) {
  debug('parseResponse', action)
  let p = Parsley.from(xml, { safe: true })
  if (p) p = p.find(`u:${action}Response`)
  if (!p) return null

  switch (action) {
    case 'GetZoneGroupState': {
      // ZoneGroupState is embedded XML
      const xml = p.find('ZoneGroupState')?.text
      if (!xml) return null
      p = Parsley.from(xml, { safe: true })
      const zones = parseZoneGroupState(p)
      return zones ? { zones } : null
    }

    case 'GetPositionInfo':
      return clean({
        trackNum: p.find('Track')?.text,
        trackURI: p.find('TrackURI')?.text,
        trackMetadata: p.find('TrackMetaData')?.text?.trim(),
        trackPos: p.find('RelTime')?.text
      })

    case 'GetMediaInfo':
      return clean({
        mediaURI: p.find('CurrentURI')?.text,
        mediaMetadata: p.find('CurrentURIMetaData')?.text?.trim()
      })

    case 'GetTransportInfo':
      return clean({
        playState: p.find('CurrentTransportState')?.text
      })

    case 'GetVolume': {
      const volume = p.find('CurrentVolume')?.text
      if (volume == null) return null
      return { volume: parseInt(volume) }
    }

    case 'GetMute': {
      const mute = p.find('CurrentMute')?.text
      if (mute == null) return null
      return { mute: mute === '1' }
    }

    case 'SetVolume':
    case 'SetMute':
    case 'SetAVTransportURI':
    case 'BecomeCoordinatorOfStandaloneGroup':
    case 'Play':
    case 'Pause':
    case 'Seek':
      return true
  }
}

export function parseEvent (service, xml) {
  debug('parseEvent', service)
  let p = Parsley.from(xml, { safe: true })

  if (service === 'ZoneGroupTopology') {
    p = p.find('ZoneGroupState')
    if (!p) return null
    p = Parsley.from(p.text, { safe: true })
    if (!p) return null
    const zones = parseZoneGroupState(p)
    return zones ? { zones } : null
  }

  p = p.find('LastChange')
  if (!p) return null
  p = Parsley.from(p.text, { safe: true })

  if (service === 'AVTransport') {
    const ret = {
      playState: p.find('TransportState', { blank: true }).attr.val,
      trackURI: p.find('CurrentTrackURI', { blank: true }).attr.val,
      trackMetadata: p.find('CurrentTrackMetaData', { blank: true }).attr.val
    }
    if (ret.trackMetadata) ret.trackMetadata = ret.trackMetadata.trim()
    return clean(ret)
  } else if (service === 'RenderingControl') {
    const ret = {
      volume: p.find(master('Volume'), { blank: true }).attr.val,
      mute: p.find(master('Mute'), { blank: true }).attr.val
    }
    if (ret.volume != null) ret.volume = parseInt(ret.volume)
    if (ret.mute != null) ret.mute = ret.mute === '1'
    return clean(ret)
  }

  function master (type) {
    return e => e.type === type && e.attr.channel === 'Master'
  }
}

export function parseDescription (xml) {
  debug('parseDescription')
  const p = Parsley.from(xml)
  return clean({
    model: p.find('displayName')?.text
  })
}

function parseZoneGroupState (p) {
  const players = []

  for (const zg of p.findAll('ZoneGroup')) {
    const leaderUuid = zg.attr.Coordinator

    for (const zgm of zg.findAll('ZoneGroupMember')) {
      const { UUID: uuid, Location: url, ZoneName: fullName } = zgm.attr
      if (fullName === 'BOOST') continue
      const address = new URL(url).hostname
      const name = fullName.replaceAll(' ', '').toLowerCase()
      const player = { name, address, uuid, fullName }
      player.leaderUuid = leaderUuid !== uuid ? leaderUuid : ''
      players.push(player)
    }
  }

  return players
}

function clean (obj) {
  const entries = Object.entries(obj).filter(([k, v]) => v != null)
  return entries.length ? Object.fromEntries(entries) : null
}
