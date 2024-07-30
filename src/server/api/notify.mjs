import Debug from '@ludlovian/debug'
import model from '@ludlovian/jonos-model'

const debug = Debug('jonos:notify')

export async function apiNotify (req, res) {
  const { db } = model

  // get the notify definition
  let sql = 'select * from notify where name=$name'
  const def = db.get(sql, { name: req.params.name })
  if (!def) {
    res.writeHead(404)
    return res.end()
  }
  debug('notify(%s)', def.name)

  // get the real leader of the group
  sql = 'select leaderName from playerEx where name=$name'
  const name = db.pluck.get(sql, { name: def.leader })
  const leader = model.byName[name]

  // get their current state
  sql = 'select playing from playerEx where name=$name'
  const curr = db.get(sql, { name })

  // and members of their group with current volumes
  sql = 'select name,volume from playerEx where leaderName=$name'
  const members = db.all(sql, { name })

  // stop any current playing
  const wasPlaying = !!curr.playing
  if (wasPlaying) await leader.pause()

  // set all volumes
  await Promise.all(
    members.map(m => model.byName[m.name].setVolume(def.volume))
  )

  // play the notification
  await leader.playNotification(def.url)

  // reset volumes
  await Promise.all(
    members.map(m => model.byName[m.name].setVolume(m.volume))
  )

  // and restart if needed
  if (wasPlaying && def.resume) await leader.play()

  res.writeHead(200)
  res.end()
}
