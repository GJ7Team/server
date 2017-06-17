const Koa = require('koa');
const IO = require('koa-socket');
const cors = require('kcors');

const redis = require('./redis');
const actions = require('./actions');

// Redis.set('game2', '666 yo');

// const getContext = async () => {
//   const game = await Redis.get('game2');
//   return { game };
// };

const app = new Koa();
app.use(cors());

app.use(async ctx => {
  // const context = await getContext();
  ctx.body = `mamke privet`;
});

const io = new IO({
  origins: '*:*',
});

io.attach(app);

app._io.on('connection', socket => {
  actions(redis, app._io, socket);
  // socket.on('join', function(name, fn) {});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT);
