import sade from 'sade'

import notify from './notify.mjs'
import preset from './preset.mjs'
import app from './server.mjs'

const version = '__VERSION__'

const prog = sade('jonos')

prog.version(version)

prog
  .command('join')
  .describe('Join everything with the right volumes')
  .option('-p, --preset', 'the preset to use', 'normal')
  .action(async ({ preset: name }) => preset(name))

prog
  .command('notify <message>')
  .describe('Plays a notification message')
  .option('-p, --player', 'the player to use', 'bedroom')
  .option('-V, --volume', 'the volume to play at', 50)
  .option('-t, --timeout', 'finish after this', '9s')
  .option('-r, --resume', 'resume playing if it was')
  .action(async (message, opts) => {
    await notify({ message, ...opts })
  })

prog
  .command('server')
  .describe('Runs webserver')
  .option('-p, --port', 'the port to use', 3500)
  .action(async ({ port }) => {
    app.listen(port, () => {
      console.log('Listening on port %d', port)
    })
  })

const parsed = prog.parse(process.argv, { lazy: true })
if (parsed) {
  const { args, handler } = parsed
  handler(...args).catch(err => {
    console.log(err)
    process.exit(1)
  })
}
