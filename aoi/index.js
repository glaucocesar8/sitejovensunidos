const app = require('../server');

module.exports = (req, res) => {

  const prefix = '/api/index';

  // Remove /api/index antes de entregar ao Express
  if (req.url.startsWith(prefix)) {
    req.url = req.url.substring(prefix.length) || '/';
  }

  return app(req, res);
};