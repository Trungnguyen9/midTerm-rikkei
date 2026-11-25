const env = require('./config/env');
const app = require('./app');

app.listen(env.port, () => {
  console.log(`Rikkei Lab API running at http://localhost:${env.port}`);
});

