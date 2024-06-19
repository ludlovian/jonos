import send from '@polka/send'
import model from '@ludlovian/jonos-model'

// import Debug from '@ludlovian/debug'
// const debug = Debug('jonos:api:player')

export async function apiMedia (req, res) {
  let url = decodeURIComponent(req.params?.url ?? '')
  if (url) {
    const { library } = model
    let item = library.locate(url)?.toJSON()
    if (item?.type === 'track') {
      url = new URL('./', url).href
      item = library.locate(url)?.toJSON()
    }
    if (item) return send(res, 200, item)
  }
  return send(res, 404)
}
