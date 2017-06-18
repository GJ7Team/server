const {
  FIXTURE_MAP_POINTS,
  FIXTURE_MAP_ID,
  MAP_COLONIES,
} = require('./fixtures');

let matchCounter = 0;

const GAME_ENTER = 'game/ENTER';

const MATCH_SEARCH_START = 'match/SEARCH_START';
const MATCH_ENTER = 'match/ENTER';
const MATCH_ATTACK = 'match/ATTACK';
const MATCH_CAST = 'match/CAST';

const createMatchChannel = (io, { enemyId, id }) => {
  const matchId = `/match-${id}-${enemyId}`;
  const matchRoom = io.of(matchId);

  console.log('create room for ' + matchId);

  matchRoom.on('connection', socket => {
    console.log('MATCH connection');
    socket.on(MATCH_ENTER, (data, res) => {
      console.log(MATCH_ENTER, data);
      res({
        map: {
          colonies: MAP_COLONIES.map(d => {
            if (d.type === 'neutral') {
              d = Object.assign({}, d, {
                x: Math.floor(Math.random() * 300) + 10,
                y: Math.floor(Math.random() * 300) + 10,
              });
            }

            return d;
          }),
        },
      });
    });

    socket.on(MATCH_ATTACK, (data, res) => {
      console.log(MATCH_ATTACK);
      console.log('attack', data);
    });

    socket.on(MATCH_CAST, (data, res) => {
      console.log(MATCH_CAST);
      console.log('cast', data);
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
    });
  });

  socket.on(MATCH_SEARCH_START, async ({ id }, res) => {
    console.log(MATCH_SEARCH_START, id);

    const createMatch = async ({ enemyId }) => {
      const matchId = createMatchChannel(io, {
        enemyId,
        id,
      });

      const enemyName = await redis.getPlayerName(enemyId);

      res({
        matchId,
        enemy: {
          id: enemyId,
          name: enemyName,
        },
      });
    };

    if (queue.length !== 0) {
      const enemyId = queue.pop();
      queueSubscribe[enemyId](id);
      queueSubscribe[enemyId] = null;

      console.log('ENEMY', enemyId);
      createMatch({
        enemyId,
      });
    } else {
      console.log('SUBSCRIBE QUEUE', id);

      queue.push(id);
      queueSubscribe[id] = enemyId => {
        createMatch({
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
