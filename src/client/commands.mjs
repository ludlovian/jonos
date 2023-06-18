import { presets, notifies } from './config.mjs'
import model from './model.mjs'
import { until } from './signal-extra.mjs'

export async function applyPreset (name) {
  const config = presets[name]
  const { leader } = config
  const l = model.byName[leader]
  if (!l.isLeader) {
    await call('/api/leader/' + leader, { leader })
    await until(() => l.isLeader)
  }

  const old = new Set(model.groups[leader])

  const proms = []
  for (const [name, volume] of config.members) {
    old.delete(name)
    proms.push(configure(name, leader, volume))
  }

  for (const name of old) {
    proms.push(call('/api/leader/' + name, { leader: name }))
  }
  await Promise.all(proms)
}

async function configure (name, leader, volume) {
  const p = model.byName[name]
  if (p.volume !== volume) {
    await call('/api/volume/' + name, { volume })
  }
  if (p.leader !== leader) {
    await call('/api/leader/' + name, { leader })
  }
}

export async function playNotify (name) {
  const config = notifies[name]
  const { leader, volume, uri } = config
  const members = model.groups[leader]
  const oldVols = members.map(n => model.byName[n].volume)
  if (model.byName[leader].isPlaying) {
    await call('/api/pause/' + leader, {})
  }

  await Promise.all(
    members.map(name => call('/api/volume/' + name, { volume }))
  )

  await call('/api/notify/' + leader, { uri })

  await Promise.all(
    members.map((name, ix) =>
      call('/api/volume/' + name, { volume: oldVols[ix] })
    )
  )
}

async function call (url, data) {
  try {
    const method = 'POST'
    const body = JSON.stringify(data)
    const res = await fetch(url, { method, body })
    if (!res.ok) throw new Error(res.statusText)
  } catch (err) {
    model.error = err
  }
}
