import send from '@polka/send'
import model from '@ludlovian/jonos-model'
import staticFile from '@ludlovian/static'

// import Debug from '@ludlovian/debug'
// const debug = Debug('jonos:api:artwork')

export default async function getArtwork (req, res) {
  const { library } = model
  const url = decodeURIComponent(req.params?.url ?? '')
  if (url) {
    const file = library.locate(url)?.artwork
    if (file) {
      if (await staticFile.sendFile(file, req, res)) return
    }
  }
  send(res, 404)
}
