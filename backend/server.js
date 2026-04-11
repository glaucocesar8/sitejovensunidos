const express = require('express');
const app = express();
//const db = require('./config/db');

app.get('/', (req, res) => {
  res.send('API rodando 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});