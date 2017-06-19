const REDIS_URL = process.env.REDIS_URL || null;
const client = require('redis').createClient(REDIS_URL);

client.on('error', function(err) {
  console.log('Error ' + err);
});

const redis = {
  hset: (namespace, key, value) => client.hset(namespace, key, value),
  hget: (namespace, key) =>
    new Promise((resolve, reject) => {
      client.hget(namespace, key, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }),
  hgetall: namespace =>
    new Promise((resolve, reject) => {
      client.hgetall(namespace, (err, res) => {
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

  getPlayerName(id) {
    return this.hget('players', id);
  },

  addToSearchQueue({ id }) {
    client.rpush('search.queue', id);
  },

  incrWin(name, i = 1) {
    client.hincrby('stats.wins', name, i);
  },

  incrLost(name, i = 1) {
    client.hincrby('stats.looses', name, i);
  },

  async getStats() {
    const wins = await this.hgetall('stats.wins');
    const looses = await this.hgetall('stats.looses');

    return {
      wins,
      looses,
    };
  },

  getEnemy() {
    return new Promise((resolve, reject) => {
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
//
// client.on('subscribe', function() {
//   console.log(arguments);
// });

// client.subscribe('search.queue', function(a, b, c) {
//   console.log(c);
// });
// client.publish('search.queue', 'add user');

// redis.del('stats.looses');
// redis.del('stats.wins');
//
// redis.incrWin('vbrashkov', 76);
// redis.incrLost('vbrashkov', 58);
//
// redis.incrWin('Simon', 24);
// redis.incrLost('Simon', 12);
//
// redis.incrWin('Bora', 36);
// redis.incrLost('Bora', 25);
//
// redis.incrWin('tuchk4', 12);
// redis.incrLost('tuchk4', 7);
//
// redis.set('world.players', 0);
// redis.del('search.queue');
// redis.del('players');
// redis.del('matches');
// redis.del('scoreboard');

module.exports = redis;
