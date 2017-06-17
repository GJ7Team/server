const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
  ctx.body = 'mamke privet';
});

app.listen(3001);
