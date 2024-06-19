import send from '@polka/send'
import model from '@ludlovian/jonos-model'

export async function apiSearch (req, res) {
  const search = decodeURIComponent(req.params?.search ?? '')
  const items = model.library.search(search).map(x => x.url)
  return send(res, 200, { items })
}
