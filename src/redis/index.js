const REDIS_URL = process.env.REDIS_URL || null;
const client = require('redis').createClient(REDIS_URL);

client.on('error', function(err) {
  console.log('Error ' + err);
});

const redis = {
  hset: (namespace, key, value) => client.hset(namespace, key, value),
  hget: (namespace, key) =>
    new Promise((resolve, error) => {
      client.hget(namespace, key, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }),
  del: key => client.del(key),
  set: (key, value) => client.set(key, value),
  get: key =>
    new Promise((resolve, error) => {
      client.get(key, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }),
  incrPlayers() {
    client.incr('world.players');
  },

  decrPlayers() {
    client.decr('world.players');
  },

  getPlayersNumber() {
    return this.get('world.players');
  },

  addPlayer({ id, name }) {
    this.hset('players', id, name);
  },

  getPlayerName(enemyId) {
    return this.hget('players', enemyId);
  },

  addToSearchQueue({ id }) {
    client.rpush('search.queue', id);
  },

  getEnemy() {
    return new Promise((resolve, error) => {
      client.lpop('search.queue', (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
};

// client.on('message', function() {
//   console.log(arguments);
// });
// client.on('subscribe', function() {
//   console.log(arguments);
// });

// client.subscribe('search.queue', function(a, b, c) {
//   console.log(c);
// });
// client.publish('search.queue', 'add user');
//
redis.set('world.players', 0);
redis.del('search.queue');
redis.del('players');
redis.del('matches');
redis.del('scoreboard');

module.exports = redis;
