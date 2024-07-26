import { lookup } from 'mrmime'
import model from '@ludlovian/jonos-model'

// import Debug from '@ludlovian/debug'
// const debug = Debug('jonos:api:artwork')

export default async function getArtwork (req, res) {
  const id = +req.params.id
  const { db } = model
  let sql = 'select artwork from media where id=$id'
  const artworkId = db.pluck.get(sql, { id })
  if (!artworkId) {
    res.writeHead(404)
    return res.end()
  }

  sql = 'select file,hash from artwork where id=$artworkId'
  const { file, hash } = db.get(sql, { artworkId })
  const [size, mtime] = hash.split('-')
  const headers = {
    'Content-Length': +size,
    'Content-Type': lookup(file),
    'Last-Modified': new Date(+mtime).toUTCString(),
    ETag: `W/"${hash}"`
  }

  if (req.headers['if-none-match'] === headers.ETag) {
    res.writeHead(304)
    res.end()
    return
  }

  sql = 'select image from artwork where id=$artworkId'
  const image = db.pluck.get(sql, { artworkId })
  res.writeHead(200, headers)
  res.end(image)
}
