import process from 'node:process'

import send from '@polka/send'
import { serialize } from '@ludlovian/serialize-json'
import sortBy from '@ludlovian/sortby'
import model from '@ludlovian/jonos-model'
import Debug from '@ludlovian/debug'

const debug = Debug('jonos:api:about')

const system = {
  isDev: process.env.NODE_ENV !== 'production',
  started: new Date(),
  version: process.env.npm_package_version ?? 'dev'
}

export async function apiAbout (req, res) {
  debug('apiAbout')
  const players = model.players.players
    .map(p => ({
      name: p.fullName,
      model: p.model,
      url: p.url
    }))
    .sort(sortBy('name'))
  const data = { system, players }
  send(res, 200, serialize(data, { date: true }))
}
