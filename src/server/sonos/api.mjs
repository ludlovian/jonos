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
  return callSOAP({ address, ...SRV.ZGT, action: 'GetZoneGroupState' })
}

export function getMediaInfo ({ address }) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'GetMediaInfo',
    params: { InstanceID: 0 }
  })
}

export function getPositionInfo ({ address }) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'GetPositionInfo',
    params: { InstanceID: 0 }
  })
}

export function getTransportInfo ({ address }) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'GetTransportInfo',
    params: { InstanceID: 0 }
  })
}

export function setAVTransportURI ({ address }, media, verify) {
  const { mediaURI, mediaMetadata = '' } = media
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'SetAVTransportURI',
    params: {
      InstanceID: 0,
      CurrentURI: mediaURI,
      CurrentURIMetaData: mediaMetadata
    },
    verify
  })
}

export function seekTrack ({ address }, trackNum) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'Seek',
    params: {
      InstanceID: 0,
      Unit: 'TRACK_NR',
      Target: trackNum.toString()
    }
  })
}

export function seekPos ({ address }, trackPos) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'Seek',
    params: {
      InstanceID: 0,
      Unit: 'REL_TIME',
      Target: trackPos
    }
  })
}

export function pause ({ address }) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'Pause',
    params: { InstanceID: 0 }
  })
}

export function play ({ address }) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'Play',
    params: { InstanceID: 0, Speed: '1' }
  })
}

export function joinGroup ({ address }, uuid, verify) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'SetAVTransportURI',
    params: {
      InstanceID: 0,
      CurrentURI: `x-rincon:${uuid}`,
      CurrentURIMetaData: ''
    },
    verify
  })
}

export function startOwnGroup ({ address }, verify) {
  return callSOAP({
    address,
    ...SRV.AVT,
    action: 'BecomeCoordinatorOfStandaloneGroup',
    params: { InstanceID: 0 },
    verify
  })
}

export function getVolume ({ address }) {
  return callSOAP({
    address,
    ...SRV.RC,
    action: 'GetVolume',
    params: { InstanceID: 0, Channel: 'Master' }
  })
}

export function getMute ({ address }) {
  return callSOAP({
    address,
    ...SRV.RC,
    action: 'GetMute',
    params: { InstanceID: 0, Channel: 'Master' }
  })
}

export function setVolume ({ address }, vol, verify) {
  return callSOAP({
    address,
    ...SRV.RC,
    action: 'SetVolume',
    params: {
      InstanceID: 0,
      Channel: 'Master',
      DesiredVolume: vol.toFixed(0)
    },
    verify
  })
}

export function setMute ({ address }, mute, verify) {
  return callSOAP({
    address,
    ...SRV.RC,
    action: 'SetMute',
    params: {
      InstanceID: 0,
      Channel: 'Master',
      DesiredMute: mute ? '1' : '0'
    },
    verify
  })
}
