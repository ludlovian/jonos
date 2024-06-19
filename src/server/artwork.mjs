import send from '@polka/send'
import model from '@ludlovian/jonos-model'

import StaticFile from './static.mjs'

// import Debug from '@ludlovian/debug'
// const debug = Debug('jonos:api:artwork')

export default async function getArtwork (req, res) {
  const { library } = model
  const url = decodeURIComponent(req.params?.url ?? '')
  if (url) {
    const file = library.artworkByUrl.get(url)
    if (file) {
      if (await StaticFile.sendFile(file, req, res)) return
    }
  }
  send(res, 404)
}
