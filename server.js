require('dotenv').config();

const express = require('express');
const app = express();
const db = require('./config/db');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://jovensunidosfc.com.br'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.options('*', cors());

function auth(req, res, next) {
  const token = req.headers.authorization;

  console.log('TOKEN RECEBIDO:', token);

  if (!token) {
    return res.status(401).json({ error: 'Token não enviado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Rota principal
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Jovens Unidos 🚀'
  });
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
        DATE_FORMAT(j.data_jogo, '%Y-%m-%d %H:%i:%s') AS data_jogo,
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

app.post('/jogos', auth, async (req, res) => {
  const { time_casa_id, time_fora_id, gols_casa, gols_fora, data_jogo, local, status } = req.body;

  try {
    await db.query(`
      INSERT INTO jogos 
      (time_casa_id, time_fora_id, gols_casa, gols_fora, data_jogo, local, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [time_casa_id, time_fora_id, gols_casa, gols_fora, data_jogo, local, status]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/jogos/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { gols_casa, gols_fora, status } = req.body;

  try {
    await db.query(`
      UPDATE jogos 
      SET gols_casa = ?, gols_fora = ?, status = ?
      WHERE id = ?
    `, [gols_casa, gols_fora, status, id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETAR
app.delete('/jogos/:id', auth, async (req, res) => {
  await db.query('DELETE FROM jogos WHERE id=?', [req.params.id]);
  res.sendStatus(200);
});

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    const [todos] = await db.query('SELECT email, senha FROM usuarios');
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];    

    const senhaValida = await bcrypt.compare(senha.trim(), user.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });

  } catch (err) {
    console.error('ERRO LOGIN:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/register', auth, async (req, res) => {
  const { email, senha } = req.body;

  const hash = await bcrypt.hash(senha, 10);

  await db.query(
    'INSERT INTO usuarios (email, senha) VALUES (?, ?)',
    [email, hash]
  );

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});