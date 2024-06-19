/** @jsx h */
import { h } from 'preact'

export function MediaArt ({ id, type }) {
  if (!id || !type) return
  id = encodeURIComponent(id)
  return <img src={`/art/${type}/${id}`} class='img-fluid' />
}
