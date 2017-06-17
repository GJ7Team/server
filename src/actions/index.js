const { FIXTURE_MAP_POINTS, FIXTURE_MAP_ID } = require('./fixtures');

let matchCounter = 0;

const GAME_ENTER = 'game.enter';

const MATCH_ENTER = 'match.enter';
const MATCH_START = 'match.start';
const MATCH_FIND = 'match.find';

const MATCH_ATTACK = 'match.attack';
const MATCH_CAST = 'match.cast';

const createMatchChannel = io => {
  const matchId = `/match-${++matchCounter}`;
  const matchRoom = io.of(matchId);

  matchRoom.on('connection', socket => {
    socket.on(MATCH_ENTER, (data, res) => {
      res({
        map: FIXTURE_MAP_ID,
        points: FIXTURE_MAP_POINTS,
      });
    });

    socket.on(MATCH_ATTACK, (data, res) => {
      console.log('attack', data);
    });

    socket.on(MATCH_CAST, (data, res) => {
      console.log('cast', data);
    });
  });

  return matchId;
};

module.exports = (redis, io, socket) => {
  socket.on(GAME_ENTER, ({ name, id }, res) => {
    // redis.set('players', {
    //   name,
    //   id,
    // });

    res({
      players: 143,
    });
  });

  socket.on(MATCH_FIND, ({ name, id }, res) => {
    const matchId = createMatchChannel(io);
    res({
      matchId,
      versus: 142,
      name: 'Doom',
    });
  });

  socket.on(MATCH_START, ({ matchId }, res) => {});
};
