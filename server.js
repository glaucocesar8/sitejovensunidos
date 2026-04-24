const express = require('express');
const app = express();
const db = require('./config/db');
const cors = require('cors');
app.use(cors());

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

app.get('/jogos', async (req, res) => {
  try {
    let query = `
      SELECT 
        j.id,
        tc.nome AS time_casa,
        tf.nome AS time_fora,
        tc.logo AS logo_casa,
        tf.logo AS logo_fora,
        j.gols_casa,
        j.gols_fora,
        j.data_jogo,
        j.local,
        j.status,
        j.time_fora_id        
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      WHERE 1=1
    `;

    let filtros = [];
    let params = [];

    if (req.query.ano) {
      filtros.push('YEAR(j.data_jogo) = ?');
      params.push(Number(req.query.ano));
    }

    if (req.query.diaSemana) {
      filtros.push('DAYOFWEEK(j.data_jogo) = ?');
      params.push(Number(req.query.diaSemana));
    }

    if (req.query.adversario) {
      filtros.push('j.time_fora_id = ?');
      params.push(Number(req.query.adversario));
    }

    if (req.query.resultado === 'vitoria') {
      filtros.push('j.gols_casa > j.gols_fora');
    }

    if (req.query.resultado === 'empate') {
      filtros.push('j.gols_casa = j.gols_fora');
    }

    if (req.query.resultado === 'derrota') {
      filtros.push('j.gols_casa < j.gols_fora');
    }

    if (filtros.length > 0) {
      query += ' AND ' + filtros.join(' AND ');
    }

    query += ' ORDER BY j.data_jogo DESC ';

    const [rows] = await db.query(query, params);

    // 🔥 VOLTOU AO PADRÃO ANTIGO
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
});

app.get('/times', async (req, res) => {
  const nome = req.query.nome || '';

  const [rows] = await db.query(`
    SELECT id, nome, logo
    FROM times
    WHERE nome LIKE ?
    LIMIT 10
  `, [`%${nome}%`]);

  res.json(rows);
});

app.get('/proximo-jogo', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        j.id,
        tc.nome AS time_casa,
        tf.nome AS time_fora,
        tc.logo AS logo_casa,
        tf.logo AS logo_fora,
        j.data_jogo,
        j.local
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      WHERE j.data_jogo >= CURDATE()
      AND j.status = 'agendado'
      ORDER BY j.data_jogo ASC
      LIMIT 1;
    `);

    if (rows.length === 0) {
      return res.json(null);
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar próximo jogo' });
  }
});

const PORT = process.env.PORT || 3000;

// 🔥 MUITO IMPORTANTE
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});