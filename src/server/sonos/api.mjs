import { callSOAP, getDescription } from './call.mjs'

const SRV = {
  ZGT: { service: 'ZoneGroupTopology', path: 'ZoneGroupTopology' },
  AVT: { service: 'AVTransport', path: 'MediaRenderer/AVTransport' },
  RC: { service: 'RenderingControl', path: 'MediaRenderer/RenderingControl' }
}

export function getDeviceDescription ({ address }) {
  return getDescription(address)
}

export function getZoneGroupState ({ address }) {
  return callSOAP(address, SRV.ZGT, 'GetZoneGroupState')
}

export function getMediaInfo ({ address }) {
  return callSOAP(address, SRV.AVT, 'GetMediaInfo', { InstanceID: 0 })
}

export function getPositionInfo ({ address }) {
  return callSOAP(address, SRV.AVT, 'GetPositionInfo', { InstanceID: 0 })
}

export function setAVTransportURI ({ address }, media) {
  const { mediaURI, mediaMetadata = '' } = media
  return callSOAP(address, SRV.AVT, 'SetAVTransportURI', {
    InstanceID: 0,
    CurrentURI: mediaURI,
    CurrentURIMetaData: mediaMetadata
  })
}

export function seekTrack ({ address }, trackNum) {
  return callSOAP(address, SRV.AVT, 'Seek', {
    InstanceID: 0,
    Unit: 'TRACK_NR',
    Target: trackNum.toString()
  })
}

export function seekPos ({ address }, trackPos) {
  return callSOAP(address, SRV.AVT, 'Seek', {
    InstanceID: 0,
    Unit: 'REL_TIME',
    Target: trackPos
  })
}

export function pause ({ address }) {
  return callSOAP(address, SRV.AVT, 'Pause', { InstanceID: 0 })
}

export function play ({ address }) {
  return callSOAP(address, SRV.AVT, 'Play', { InstanceID: 0, Speed: '1' })
}

export function joinGroup (p, uuid, verify) {
  return setAVTransportURI(p, { mediaURI: `x-rincon:${uuid}` }, { verify })
}

export function startOwnGroup ({ address }, verify) {
  return callSOAP(
    address,
    SRV.AVT,
    'BecomeCoordinatorOfStandaloneGroup',
    {
      InstanceID: 0
    },
    { verify }
  )
}

export function setVolume ({ address }, vol, verify) {
  return callSOAP(
    address,
    SRV.RC,
    'SetVolume',
    {
      InstanceID: 0,
      Channel: 'Master',
      DesiredVolume: vol.toFixed(0)
    },
    { verify }
  )
}

export function setMute ({ address }, mute, verify) {
  return callSOAP(
    address,
    SRV.RC,
    'SetMute',
    {
      InstanceID: 0,
      Channel: 'Master',
      DesiredMute: mute ? '1' : '0'
    },
    { verify }
  )
}
