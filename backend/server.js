const express = require('express');
const app = express();
const db = require('./config/db');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Jovens Unidos rodando 🚀');
});

app.get('/jogadores', (req, res) => {
  db.query('SELECT * FROM jogadores', (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando');
});