import send from '@polka/send'
import sortBy from '@ludlovian/sortby'
import model from '@ludlovian/jonos-model'

export async function apiSearch (req, res) {
  const { db } = model
  const search = decodeURIComponent(req.params?.search ?? '')
  if (search.length < 3) return send(res, 200, { items: [] })
  const sql =
    "select metadata from searchMediaEx where text match $search || '*'"
  const sortFn = sortBy('type')
    .thenBy('albumArtist')
    .thenBy('album')
  const items = db
    .all(sql, { search })
    .map(row => JSON.parse(row.metadata))
    .sort(sortFn)
  return send(res, 200, { items })
}
