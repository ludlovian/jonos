#!/usr/bin/env node
import sade from 'sade';
import { format } from 'util';
import { red, green, yellow, blue, magenta, cyan, grey } from 'kleur/colors';
import { URL } from 'url';
import { AsyncDeviceDiscovery, Sonos } from 'sonos';
import { parse } from '@lukeed/ms';

const colourFuncs = { red, green, yellow, blue, magenta, cyan, grey };
const colours = Object.keys(colourFuncs);
const CLEAR_LINE = '\r\x1b[0K';
const RE_DECOLOR = /(^|[^\x1b]*)((?:\x1b\[\d*m)|$)/g; // eslint-disable-line no-control-regex

const state = {
  dirty: false,
  width: process.stdout && process.stdout.columns,
  level: process.env.LOGLEVEL,
  write: process.stdout.write.bind(process.stdout)
};

process.stdout &&
  process.stdout.on('resize', () => (state.width = process.stdout.columns));

function _log (
  args,
  { newline = true, limitWidth, prefix = '', level, colour }
) {
  if (level && (!state.level || state.level < level)) return
  const msg = format(...args);
  let string = prefix + msg;
  if (colour && colour in colourFuncs) string = colourFuncs[colour](string);
  if (limitWidth) string = truncate(string, state.width);
  if (newline) string = string + '\n';
  if (state.dirty) string = CLEAR_LINE + string;
  state.dirty = !newline && !!msg;
  state.write(string);
}

function truncate (string, max) {
  max -= 2; // leave two chars at end
  if (string.length <= max) return string
  const parts = [];
  let w = 0
  ;[...string.matchAll(RE_DECOLOR)].forEach(([, txt, clr]) => {
    parts.push(txt.slice(0, max - w), clr);
    w = Math.min(w + txt.length, max);
  });
  return parts.join('')
}

function merge (old, new_) {
  const prefix = (old.prefix || '') + (new_.prefix || '');
  return { ...old, ...new_, prefix }
}

function logger (options) {
  return Object.defineProperties((...args) => _log(args, options), {
    _preset: { value: options, configurable: true },
    _state: { value: state, configurable: true },
    name: { value: 'log', configurable: true }
  })
}

function nextColour () {
  const clr = colours.shift();
  colours.push(clr);
  return clr
}

function fixup (log) {
  const p = log._preset;
  Object.assign(log, {
    status: logger(merge(p, { newline: false, limitWidth: true })),
    level: level => fixup(logger(merge(p, { level }))),
    colour: colour =>
      fixup(logger(merge(p, { colour: colour || nextColour() }))),
    prefix: prefix => fixup(logger(merge(p, { prefix }))),
    ...colourFuncs
  });
  return log
}

const log = fixup(logger({}));

const debug$2 = log
  .prefix('player:')
  .level(2)
  .colour();

class Player {
  constructor (sonosPlayer) {
    Object.defineProperty(this, 'sonos', {
      configurable: true,
      value: sonosPlayer
    });
  }

  async _load () {
    const desc = await this.sonos.deviceDescription();
    Object.assign(this, {
      address: this.sonos.host,
      name: desc.roomName,
      model: desc.displayName
    });
  }

  static async getAny () {
    const discovery = new AsyncDeviceDiscovery();
    return Player.fromSonos(await discovery.discover())
  }

  static async fromSonos (sonosPlayer) {
    const p = new Player(sonosPlayer);
    await p._load();
    return p
  }

  static async discover () {
    const any = await Player.getAny();
    const sonosGroups = await any.sonos.getAllGroups();
    Player.groups.clear();
    await Promise.all(sonosGroups.map(PlayerGroup.fromSonos));
    debug$2('%d group(s) discovered', Player.groups.size);
    return Player.groups
  }

  static get (name) {
    for (const p of Player.all({ includeBoost: true })) {
      if (p.name === name || p.nickname === name || p.address === name) {
        return p
      }
    }
    throw new Error(`No such player: ${name}`)
  }

  get nickname () {
    return this.name.replace(/ /g, '').toLowerCase()
  }

  isController () {
    return this === this.group.controller
  }

  isPlayer () {
    return this.model.toLowerCase() !== 'boost'
  }

  inGroupWith (other) {
    return this.group === other.group
  }
}

Player.groups = new Set();
Player.all = function * all ({ includeBoost } = {}) {
  for (const group of Player.groups) {
    for (const player of group.members) {
      if (includeBoost || player.isPlayer()) {
        yield player;
      }
    }
  }
};

class PlayerGroup {
  constructor () {
    this.members = new Set();
    Player.groups.add(this);
  }

  static async fromSonos (sonosGroup) {
    const group = new PlayerGroup();
    const address = sonosGroup.host;

    await Promise.all(
      sonosGroup.ZoneGroupMember.map(async member => {
        const url = new URL(member.Location);
        const player = await Player.fromSonos(new Sonos(url.hostname));
        group._add(player, { asController: player.address === address });
      })
    );

    debug$2('Group of size %d discovered', group.members.size);
    return group
  }

  // controller is always the first member
  get controller () {
    return this.members.values().next().value
  }

  set controller (player) {
    this.members = new Set([player, ...this.members]);
  }

  _add (player, { asController } = {}) {
    if (player.group) player.group._remove(player);
    player.group = this;
    this.members.add(player);
    if (asController) this.controller = player;
  }
}

const debug$1 = log
  .prefix('join:')
  .level(1)
  .colour();

const PLAYERS = [
  { name: 'bedroom', volume: 25 },
  { name: 'parlour', volume: 25 },
  { name: 'bookroom', volume: 25 },
  { name: 'kitchen', volume: 25 },
  { name: 'office', volume: 12 },
  { name: 'diningroom', volume: 12 }
];

async function join () {
  await Player.discover();

  const bedroom = Player.get('bedroom');
  if ((await bedroom.sonos.getCurrentState()) !== 'playing') {
    debug$1('Bedroom not playing. Quitting');
    return
  }

  let dirty;

  for (const { name, volume } of PLAYERS) {
    const p = Player.get(name);
    await p.sonos.setVolume(volume);
    debug$1('%s volume set', name);
    if (!p.inGroupWith(bedroom)) {
      await p.sonos.joinGroup(bedroom.name);
      dirty = true;
      debug$1('%s added to group', name);
    }
  }

  if (dirty) {
    await Player.discover();
  }
}

const debug = log
  .prefix('notify')
  .level(1)
  .colour();

const NOTIFY_URLS = {
  downstairs:
    'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3'
};

async function notify (
  message,
  { player: playerName, volume, timeout }
) {
  const uri = NOTIFY_URLS[message];
  if (!uri) throw new Error(`Unknown message: ${message}`)

  await Player.discover();
  const controller = Player.get(playerName).group.controller;
  const players = Array.from(controller.group.members);

  const oldVolumes = await Promise.all(players.map(p => p.sonos.getVolume()));
  const isPlaying = (await controller.sonos.getCurrentState()) === 'playing';

  debug('Playing message: %s', message);
  // pause the current playing if needed
  if (isPlaying) await controller.sonos.pause();

  // set the volumes manually
  await Promise.all(players.map(p => p.sonos.setVolume(volume)));

  // play the notification
  await Promise.race([
    controller.sonos.playNotification({ uri }),
    delay(parse(timeout))
  ]);

  // now reset the volumes
  await Promise.all(players.map((p, i) => p.sonos.setVolume(oldVolumes[i])));

  // and restart the music if necessary
  if (isPlaying) await controller.sonos.play();

  // all done, so schedule an exit
  delay(500).then(() => process.exit(0));
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const version = '1.1.2';

const prog = sade('jonos');

prog.version(version);

prog
  .command('join')
  .describe('Join everything with the right volumes')
  .action(wrap(join));

prog
  .command('notify <message>')
  .describe('Plays a notification message')
  .option('--player', 'the player to use', 'bedroom')
  .option('--volume', 'the volume to play at', 50)
  .option('--timeout', 'finish after this', '9s')
  .action(wrap(notify));

prog.parse(process.argv);

function wrap (fn) {
  return (...args) =>
    Promise.resolve()
      .then(() => fn(...args))
      .catch(err => {
        console.log(err);
        process.exit(1);
      })
}
