import model from '@ludlovian/jonos-model'

export async function apiPreset (req, res) {
  const name = req.params.name
  const { db } = model

  const sql = 'select * from preset where name=$name'
  const def = db.get(sql, { name })
  if (!def) {
    res.writeHead(404)
    return res.end()
  }
  def.volumes = JSON.parse(def.volumes)

  const leader = model.byName[def.leader]
  await ensureLeader(leader)
  await setAllVolumes(def.volumes)
  await transferMusicTo(leader)
  await ensureGroup(leader, Object.keys(def.volumes))
  res.writeHead(200)
  res.end()
}

async function ensureLeader (leader) {
  const { db } = model
  const sql = 'select id=leader as isLeader from playerStatus where id=$id'
  const isLeader = db.pluck.get(sql, { id: leader.id })
  if (!isLeader) await leader.doTask('startGroup')
}

async function setAllVolumes (volumes) {
  await Promise.all(
    Object.entries(volumes).map(([name, vol]) =>
      model.byName[name].doTask('setVolume', vol)
    )
  )
}

async function transferMusicTo (leader) {
  const { db } = model
  let sql = 'select playing from playerEx where id=$id'
  const isPlaying = db.pluck.get(sql, { id: leader.id })
  if (isPlaying) return

  sql = `
    select name, metadata, items from playerEx
    where playing = true and isLeader = true
  `
  const curr = db.get(sql)
  if (!curr) return

  const currPlayer = model.byName[curr.name]
  await currPlayer.doTask('pause')
  if (curr.items) {
    const urls = JSON.parse(curr.items)
    await leader.doTask('enqueue', urls, { play: true, repeat: true })
  } else {
    const urls = [JSON.parse(curr.metadata).url]
    await leader.doTask('enqueue', urls, { play: true })
  }
}

async function ensureGroup (leader, names) {
  const { db } = model
  names = new Set(names)
  const sql = 'select name from playerEx where leaderName=$leaderName'
  const curr = new Set(db.pluck.all(sql, { leaderName: leader.name }))
  const toGo = Array.from(curr).filter(name => !names.has(name))
  const toAdd = Array.from(names).filter(name => !curr.has(name))
  for (const name of toGo) {
    await model.byName[name].doTask('startGroup')
  }
  for (const name of toAdd) {
    await model.byName[name].doTask('joinGroup', leader.name)
  }
}
