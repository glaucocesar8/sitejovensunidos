const app = require('../server');

module.exports = (req, res) => {

  // Remove /api da URL antes de entregar
  // a requisição ao Express.

  if (req.url.startsWith('/api')) {
    req.url =
      req.url.substring(4) || '/';
  }

  return app(req, res);

};