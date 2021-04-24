#!/usr/bin/env node
import sade from 'sade';
import Debug from 'debug';
import { URL } from 'url';
import { AsyncDeviceDiscovery, Sonos } from 'sonos';
import ms from 'ms';

const debug$2 = Debug('jonos:player');

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

const debug$1 = Debug('jonos:cmd:join');

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

const debug = Debug('jonos:cmd:notify');

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
    delay(ms(timeout + ''))
  ]);

  // now reset the volumes
  await Promise.all(players.map((p, i) => p.sonos.setVolume(oldVolumes[i])));

  // and restart the music if necessary
  if (isPlaying) await controller.sonos.play();

  // all done, so schedule an exit
  delay(500).then(() => process.exit(0));
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const version = '1.1.0';

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
