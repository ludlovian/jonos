import os from 'node:os'

import configure from '@ludlovian/configure'

export default configure('JONOS_', {
  isDev: process.env.NODE_ENV !== 'production',
  serverPort: 3500,
  clientPath: './dist/public',
  serverAddress: getMyIP(),
  statusThrottle: 200,

  staticCache: '.cache.sqlite'
})

function getMyIP () {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(({ family, internal }) => family === 'IPv4' && !internal).address
}
