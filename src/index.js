const Koa = require('koa');
const app = new Koa();

const REDIS_URL = process.env.REDIS_URL || null;
const client = require('redis').createClient(REDIS_URL);

const redisGet = key =>
  new Promise((resolve, error) => {
    client.get(key, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

client.on('error', function(err) {
  console.log('Error ' + err);
});

client.set('game2', '666');

const getContext = async () => {
  const game = await redisGet('game2');

  return { game };
};

app.use(async ctx => {
  const context = await getContext();
  ctx.body = `mamke privet ${context.game}`;
});

const PORT = process.env.PORT || 8080;
app.listen(PORT);
