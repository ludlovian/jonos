import sade from 'sade'
import { version } from '../package.json'

import join from './join'
import notify from './notify'

const prog = sade('jonos')

prog.version(version)

prog
  .command('join')
  .describe('Join everything with the right volumes')
  .action(wrap(join))

prog
  .command('notify <message>')
  .describe('Plays a notification message')
  .option('--player', 'the player to use', 'bedroom')
  .option('--volume', 'the volume to play at', 50)
  .option('--timeout', 'finish after this', '9s')
  .action(wrap(notify))

prog.parse(process.argv)

function wrap (fn) {
  return (...args) =>
    Promise.resolve()
      .then(() => fn(...args))
      .catch(err => {
        console.log(err)
        process.exit(1)
      })
}
