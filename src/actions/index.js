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

const maps = {};
const generatMatchMap = matchId => {
  let counter = 0;
  maps[matchId] = MAP_COLONIES.map(d => {
    if (d.type === 'neutral') {
      d = Object.assign({}, d, {
        x: Math.floor(Math.random() * 300) + 10,
        y: Math.floor(Math.random() * 300) + 10,
      });
    }

    return Object.assign({}, d, {
      id: ++counter,
    });
  });
};

const createMatchChannel = (io, { id, leftId, rightId }) => {
  const matchId = `/match-${leftId}-${rightId}`;
  const matchRoom = io.of(matchId);

  console.log('create room for ' + matchId);

  matchRoom.on('connection', socket => {
    console.log('MATCH connection');

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

const queue = [];
const queueSubscribe = {};

module.exports = (redis, io, socket) => {
  socket.on(GAME_ENTER, async ({ name, id }, res) => {
    console.log(GAME_ENTER, name, id);

    const player = redis.hget('players', name);

    if (!player) {
      redis.incrPlayers();
    }

    redis.addPlayer({
      id,
      name,
    });

    const players = await redis.getPlayersNumber();

    res({
      name,
      id,
      players,
      scoreboard: FIXTURES_SCOREBOARD,
    });
  });

  socket.on(MATCH_SEARCH_START, async ({ id }, res) => {
    console.log(MATCH_SEARCH_START, id);

    const createMatch = async ({ leftId, rightId, enemyId, generateMap }) => {
      const matchId = createMatchChannel(io, {
        id,
        leftId,
        rightId,
      });

      if (generateMap) {
        generatMatchMap(matchId);
      }

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
      createMatch({
        rightId: enemyId,
        leftId: id,
        enemyId,
        generateMap: true,
      });

      queueSubscribe[enemyId](id);
      queueSubscribe[enemyId] = null;
    } else {
      console.log('SUBSCRIBE QUEUE', id);

      queue.push(id);
      queueSubscribe[id] = enemyId => {
        createMatch({
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
