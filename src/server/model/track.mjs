import Parsley from 'parsley'

const MP3_RADIO = 'x-rincon-mp3radio://'
const CIFS_FILE = 'x-file-cifs://'
const TV = 'x-sonos-htastream:'

const KNOWN_MP3_RADIO = new Map([
  ['https://allclassical.streamguys1.com/ac128kmp3', 'All Classical Portland']
])

export function getTrackDetails (uri, metadata) {
  if (!uri) return []

  const p = Parsley.from(metadata, { safe: true })

  if (uri.startsWith(MP3_RADIO)) {
    //
    // Streaming MP3 radio
    //
    return [
      KNOWN_MP3_RADIO.get(uri.slice(MP3_RADIO.length)) ?? '',
      'MP3 Radio',
      p?.find('r:streamContent')?.text ?? ''
    ]
  } else if (uri.startsWith(CIFS_FILE)) {
    //
    // Local file playing via CIFS
    //
    return [
      p?.find('r:albumArtist')?.text ?? '',
      p?.find('upnp:album')?.text ?? '',
      p?.find('dc:title')?.text ?? ''
    ]
  } else if (uri.startsWith(TV)) {
    //
    // Streaming from the TV
    //
    return ['', 'TV', '']
  } else if (uri.startsWith('https://')) {
    //
    // Playing a file from the web
    //
    return ['', 'Web stream', p?.find('dc:title')?.text ?? '']
  } else {
    //
    // Anything else
    //
    return []
  }
}
