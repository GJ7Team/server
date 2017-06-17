const REDIS_URL = process.env.REDIS_URL || null;
const client = require('redis').createClient(REDIS_URL);

client.on('error', function(err) {
  console.log('Error ' + err);
});

module.exports = {
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
};
