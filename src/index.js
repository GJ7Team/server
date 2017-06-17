const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
  ctx.body = 'mamke privet';
});

const port = process.env.PORT || 8080;
app.listen(port);
