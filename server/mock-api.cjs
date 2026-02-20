require('dotenv').config();

const app = require('./mock-api-full.cjs');

const PORT = Number(process.env.API_PORT || process.env.PORT || 5050);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Mock API listening on ${PORT}`));
}

module.exports = app;
