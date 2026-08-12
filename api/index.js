const app = require('../server');

module.exports = (req, res) => {

  if (req.query.path) {
    req.url = req.query.path;
  }

  return app(req, res);

};