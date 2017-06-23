const {
  FIXTURE_MAP_POINTS,
  FIXTURES_SCOREBOARD,
  FIXTURE_MAP_ID,
  MAP_COLONIES,
} = require('./fixtures');

let matchCounter = 0;

const GAME_ENTER = 'game/ENTER';

const MATCH_SEARCH_START = 'match/SEARCH_START';
const MATCH_ENTER = 'match/ENTER';
const MATCH_ATTACK = 'match/ATTACK';
const MATCH_CAST = 'match/CAST';
const MATCH_TICK = 'match/TICK';
const MATCH_PLAYER_LEFT = 'match/PLAYER_LEFT';

const MATCH_LOST = 'match/LOST';
const MATCH_WIN = 'match/WIN';

const maps = {};
// const ZONES = [{
//   x1: 10, x2: 100
//   y1: 10, y2: 100
// }, {}, {}, {}, {}, {}];
const generatMatchMap = matchId => {
  let counter = 0;
  // let neutralIndex = 0;
  maps[matchId] = MAP_COLONIES.map(d => {
    if (d.type === 'neutral') {
      // neutralIndex++;
      d = Object.assign({}, d, {
        x: d.x, //Math.floor(Math.random() * 500) + 80,
        y: Math.floor(Math.random() * 280) + 100,
      });
    }

    return Object.assign({}, d, {
      id: ++counter,
    });
  });
};

const TICK = '1000';

const createMatchChannel = (io, redis, { matchId, id, leftId, rightId }) => {
  // const matchId = `/match-${leftId}-${rightId}`;
  const matchRoom = io.of(matchId);

  console.log('create room for ' + matchId);

  setInterval(() => {
    matchRoom.emit(MATCH_TICK, {
      leftCollony: 1,
      rightCollony: 1,
    });
  }, TICK);

  matchRoom.on('connection', socket => {
    console.log('MATCH connection');

    // MATCH DISCONENCT
    socket.on(MATCH_PLAYER_LEFT, () => {
      delete io.nsps[matchId];
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit(MATCH_PLAYER_LEFT);

      delete io.nsps[matchId];
    });

    socket.on(MATCH_WIN, async ({ id }, res) => {
      const name = await redis.getPlayerName(id);
      redis.incrWin(name);
      res();
    });

    socket.on(MATCH_LOST, async ({ id }, res) => {
      const name = await redis.getPlayerName(id);
      redis.incrLost(name);
      res();
    });

    socket.on(MATCH_ENTER, ({ id }, res) => {
      console.log(MATCH_ENTER, id);

      const map = maps[matchId].map(d => {
        if (leftId === id) {
          if (d.type === 'ally') {
            d = Object.assign({}, d, {
              type: 'enemy',
              image: 'colony:enemy',
            });
          } else if (d.type === 'enemy') {
            d = Object.assign({}, d, {
              type: 'ally',
              image: 'colony:ally',
            });
          }
        }

        return d;
      });

      res({
        map: {
          colonies: map,
        },
      });
    });

    socket.on(MATCH_ATTACK, (data, res) => {
      console.log(MATCH_ATTACK);

      console.log('broadcast attack', data);

      socket.broadcast.emit(MATCH_ATTACK, data);

      res(data);
    });

    socket.on(MATCH_CAST, (data, res) => {
      console.log(MATCH_CAST);
      console.log('cast', data);
      res(data);
    });
  });

  return matchId;
};

const local = {
  playersOnline: [],
};

const queue = [];
function removeFromQueue(id) {
  const queueIndex = queue.indexOf(id);
  if (queueIndex !== -1) {
    queue.splice(queueIndex, 1);
  }
}
const queueSubscribe = {};
const playersOnline = [];
function getUserTag(name, id) {
  return `${name}-${id}`;
}
function removeFromOnline(name, id) {
  const onlineIndex = playersOnline.indexOf(`${name}-${id}`);
  if (onlineIndex !== -1) {
    playersOnline.splice(onlineIndex, 1);
  }
}
let counter = 0;

module.exports = async (redis, io, socket) => {

  function onPlayersOnlineChange() {
    socket.broadcast.emit('playersOnline', playersOnline);
  }

  socket.on(GAME_ENTER, async ({ name, id }, res) => {
    console.log(GAME_ENTER, name, id);
    playersOnline.push(`${name}-${id}`);
    onPlayersOnlineChange();

    socket.on('disconnect', () => {
      console.log('disconnect', id);
      removeFromOnline(name, id);
      removeFromQueue(id);
      queueSubscribe[id] = null;
      onPlayersOnlineChange();
    });

    const player = await redis.hget('players', id);

    if (!player) {
      redis.incrPlayers();
    }

    redis.addPlayer({
      id,
      name,
    });

    const players = await redis.getPlayersNumber();
    const stats = await redis.getStats();

    res({
      name,
      id,
      players,
      stats,
      playersOnline,
    });
  });

  socket.on(MATCH_SEARCH_START, async ({ id }, res) => {
    console.log(MATCH_SEARCH_START, id);

    const joinMatch = async ({ matchId, leftId, rightId, enemyId }) => {
      const enemyName = await redis.getPlayerName(enemyId);

      res({
        matchId,
        leftId,
        rightId,
        enemy: {
          id: enemyId,
          name: enemyName,
        },
      });
    };

    const createMatch = async ({ matchId, leftId, rightId, enemyId }) => {
      createMatchChannel(io, redis, {
        matchId,
        id,
        leftId,
        rightId,
      });

      generatMatchMap(matchId);

      const enemyName = await redis.getPlayerName(enemyId);

      // setTimeout(() => {
      res({
        matchId,
        leftId,
        rightId,
        enemy: {
          id: enemyId,
          name: enemyName,
        },
      });
      // }, 500);
    };

    if (queue.length !== 0) {
      const enemyId = queue.pop();

      console.log('ENEMY', enemyId);
      const matchId = `/match-${++counter}`;
      createMatch({
        rightId: enemyId,
        leftId: id,
        enemyId,
        matchId,
      });

      queueSubscribe[enemyId](id, matchId);
      queueSubscribe[enemyId] = null;
    } else {
      console.log('SUBSCRIBE QUEUE', id);

      queue.push(id);
      queueSubscribe[id] = (enemyId, matchId) => {
        joinMatch({
          matchId,
          leftId: enemyId,
          rightId: id,
          enemyId,
        });
      };
    }

    // const enemyId = await redis.getEnemy();
    // const enemyId = await redis.getEnemy();
    // console.log('enemy', enemyId);

    // if (!enemyId) {
    //   redis.addToSearchQueue({
    //     id,
    //   });
    // } else {
    //   createMatch({
    //     enemyId,
    //   });
    // }

    // const matchId = createMatchChannel(io);
    //
    // setTimeout(() => {
    //   res({
    //     matchId,
    //     enemy: {
    //       id: 142,
    //       name: 'Doom',
    //     },
    //   });
    // }, 1000);
  });
};
