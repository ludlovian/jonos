import { CIFS, RADIO, TV, WEB } from '@ludlovian/jonos-api/constants'

export function isValidUrl (url) {
  return (
    url &&
    (url.startsWith(CIFS) ||
      url.startsWith(RADIO) ||
      url.startsWith(WEB) ||
      url.startsWith(TV))
  )
}
