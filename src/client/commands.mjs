import model from './model.mjs'

export async function post (url, data) {
  try {
    const opts = { method: 'POST' }
    if (data) opts.body = JSON.stringify(data)
    const res = await window.fetch(url, opts)
    if (!res.ok) throw new Error(res.statusText)
  } catch (err) {
    model.error = err
  }
}
