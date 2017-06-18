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

const createMatchChannel = io => {
  const matchId = `/match-${++matchCounter}`;
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

module.exports = (redis, io, socket) => {
  socket.on(GAME_ENTER, ({ name, id }, res) => {
    console.log(GAME_ENTER, name, id);
    res({
      name,
      id,
      players: 143,
    });
  });

  socket.on(MATCH_SEARCH_START, ({ name, id }, res) => {
    console.log(MATCH_SEARCH_START, name, id);
    const matchId = createMatchChannel(io);

    setTimeout(() => {
      res({
        matchId,
        enemy: {
          id: 142,
          name: 'Doom',
        },
      });
    }, 1000);
  });
};
