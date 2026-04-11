const express = require('express');
const app = express();
//const db = require('./config/db');

app.use(express.json());

app.get('/test-db', (req, res) => {
  db.query('SELECT 1', (err, result) => {
    if (err) return res.send(err);
    res.send('Banco conectado 🚀');
  });
});

app.get('/', (req, res) => {
  res.send('API Jovens Unidos rodando 🚀');
});

app.get('/jogadores', (req, res) => {
  db.query('SELECT * FROM jogadores', (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' * PORT);
});