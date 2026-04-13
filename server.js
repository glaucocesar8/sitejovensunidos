const express = require('express');
const app = express();

// rota principal (OBRIGATÓRIA)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Jovens Unidos 🚀'
  });
});

// rota de teste
app.get('/test', (req, res) => {
  res.send('Teste OK ✅');
});

const PORT = process.env.PORT || 3000;

// 🔥 MUITO IMPORTANTE
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});