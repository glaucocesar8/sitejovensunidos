const app = require('../server');

module.exports = (req, res) => {

  // A Vercel chama a função através de /api/...
  // O Express possui as rotas sem /api.

  const originalUrl = req.url;

  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4) || '/';
  }

  app(req, res);

};