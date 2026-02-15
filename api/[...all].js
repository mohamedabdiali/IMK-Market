const app = require("../server/mock-api-full.cjs");

module.exports = (req, res) => app(req, res);
