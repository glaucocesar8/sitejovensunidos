require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const {
  sheets,
  SPREADSHEET_ID,
  getValues,
  appendRows,
  updateRange
} = require('./services/googleSheets');


// ======================================================
// CORS
// ======================================================

app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://jovensunidosfc.com.br',
    'https://www.jovensunidosfc.com.br'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.options('*', cors());


// ======================================================
// AUTENTICAÇÃO JWT
// ======================================================

function auth(req, res, next) {

  const authorization = req.headers.authorization;

  console.log(
    'AUTHORIZATION RECEBIDO:',
    authorization
  );

  if (!authorization) {

    return res.status(401).json({
      error: 'Token não enviado'
    });

  }

  // Espera:
  // Authorization: Bearer TOKEN

  const partes = authorization.split(' ');

  if (
    partes.length !== 2 ||
    partes[0].toLowerCase() !== 'bearer'
  ) {

    return res.status(401).json({
      error: 'Formato de token inválido'
    });

  }

  const token = partes[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    console.error(
      'ERRO JWT:',
      err.message
    );

    return res.status(403).json({
      error: 'Token inválido'
    });

  }

}


// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {

  res.status(200).json({
    status: 'ok',
    message: 'API Jovens Unidos 🚀'
  });

});


// ======================================================
// GERAR PRÓXIMO ID DOS JOGOS
// ======================================================

async function gerarProximoIdJogos() {

  const rows = await getValues(
    'jogos!A2:A1000'
  );

  let maiorId = 0;

  rows.forEach(row => {

    const id = Number(row[0]);

    if (!isNaN(id) && id > maiorId) {
      maiorId = id;
    }

  });

  return maiorId + 1;

}


// ======================================================
// GET /JOGOS
// ======================================================

app.get('/jogos', async (req, res) => {

  try {

    const jovensUnidosId = Number(
      process.env.JOVENS_UNIDOS_ID || 1
    );


    // ==========================================
    // LER JOGOS
    // ==========================================

    const jogosResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: SPREADSHEET_ID,

        range: 'jogos!A1:H1000'

      });

    const jogosRows =
      jogosResponse.data.values || [];

    const jogos =
      jogosRows.slice(1);


    // ==========================================
    // LER TIMES
    // ==========================================

    const timesResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: SPREADSHEET_ID,

        range: 'times!A1:C1000'

      });

    const timesRows =
      timesResponse.data.values || [];

    const times =
      timesRows.slice(1);


    // ==========================================
    // MAPA DOS TIMES
    // ==========================================

    const timesMap = new Map();

    times.forEach(time => {

      const id = Number(time[0]);

      timesMap.set(id, {

        id,

        nome: time[1] || '',

        logo: time[2] || ''

      });

    });


    // ==========================================
    // TRANSFORMAR JOGOS
    // ==========================================

    let resultado = jogos.map(jogo => {

      const id = Number(jogo[0]);

      const timeCasaId =
        Number(jogo[1]);

      const timeForaId =
        Number(jogo[2]);

      const golsCasa =
        Number(jogo[3] || 0);

      const golsFora =
        Number(jogo[4] || 0);

      const dataJogo =
        jogo[5] || '';

      const local =
        jogo[6] || '';

      const status =
        jogo[7] || '';


      const timeCasa =
        timesMap.get(timeCasaId);

      const timeFora =
        timesMap.get(timeForaId);


      // ========================================
      // IDENTIFICAR MANDO DE CAMPO
      // ========================================

      const jovensUnidosEmCasa =
        timeCasaId === jovensUnidosId;

      const jovensUnidosFora =
        timeForaId === jovensUnidosId;


      // ========================================
      // CALCULAR RESULTADO
      // ========================================

      let resultadoJogo = null;

      if (status === 'finalizado') {

        if (golsCasa === golsFora) {

          resultadoJogo = 'empate';

        }

        else if (jovensUnidosEmCasa) {

          resultadoJogo =
            golsCasa > golsFora
              ? 'vitoria'
              : 'derrota';

        }

        else if (jovensUnidosFora) {

          resultadoJogo =
            golsFora > golsCasa
              ? 'vitoria'
              : 'derrota';

        }

      }


      return {

        id,

        time_casa:
          timeCasa
            ? timeCasa.nome
            : '',

        time_fora:
          timeFora
            ? timeFora.nome
            : '',

        logo_casa:
          timeCasa
            ? timeCasa.logo
            : '',

        logo_fora:
          timeFora
            ? timeFora.logo
            : '',

        gols_casa: golsCasa,

        gols_fora: golsFora,

        data_jogo: dataJogo,

        local,

        status,

        time_casa_id: timeCasaId,

        time_fora_id: timeForaId,

        resultado: resultadoJogo

      };

    });


    // ==========================================
    // FILTRO POR ANO
    // ==========================================

    if (req.query.ano) {

      const ano =
        Number(req.query.ano);

      resultado =
        resultado.filter(jogo => {

          const data =
            new Date(
              jogo.data_jogo.replace(
                ' ',
                'T'
              )
            );

          return (
            data.getFullYear() === ano
          );

        });

    }


    // ==========================================
    // FILTRO POR DIA DA SEMANA
    // ==========================================

    if (req.query.diaSemana) {

      const diaSemana =
        Number(req.query.diaSemana);

      resultado =
        resultado.filter(jogo => {

          const data =
            new Date(
              jogo.data_jogo.replace(
                ' ',
                'T'
              )
            );

          const diaMySQL =
            data.getDay() + 1;

          return (
            diaMySQL === diaSemana
          );

        });

    }


    // ==========================================
    // FILTRO POR ADVERSÁRIO
    // ==========================================

    if (req.query.adversario) {

      const adversario =
        Number(req.query.adversario);

      resultado =
        resultado.filter(jogo => {

          return (

            (
              jogo.time_casa_id === adversario &&
              jogo.time_fora_id === jovensUnidosId
            )

            ||

            (
              jogo.time_fora_id === adversario &&
              jogo.time_casa_id === jovensUnidosId
            )

          );

        });

    }


    // ==========================================
    // FILTRO POR RESULTADO
    // ==========================================

    if (req.query.resultado) {

      resultado =
        resultado.filter(jogo => {

          return (
            jogo.resultado ===
            req.query.resultado
          );

        });

    }


    // ==========================================
    // ORDENAR POR DATA
    // ==========================================

    resultado.sort((a, b) => {

      return (

        new Date(
          b.data_jogo.replace(
            ' ',
            'T'
          )
        )

        -

        new Date(
          a.data_jogo.replace(
            ' ',
            'T'
          )
        )

      );

    });


    res.json(resultado);


  } catch (error) {

    console.error(
      'ERRO AO BUSCAR JOGOS NO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error: 'Erro ao buscar jogos',

      details: error.message

    });

  }

});


// ======================================================
// GET /TIMES
// ======================================================

app.get('/times', async (req, res) => {

  try {

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId: SPREADSHEET_ID,

        range: 'times!A1:C1000'

      });

    const rows =
      response.data.values || [];

    const times =
      rows.slice(1);

    const nome =
      (req.query.nome || '')
        .toLowerCase()
        .trim();

    let resultado =
      times.map(time => {

        return {

          id: Number(time[0]),

          nome:
            time[1] || '',

          logo:
            time[2] || ''

        };

      });


    // ==========================================
    // FILTRO POR NOME
    // ==========================================

    if (nome) {

      resultado =
        resultado.filter(time =>

          time.nome
            .toLowerCase()
            .includes(nome)

        );

    }


    // ==========================================
    // LIMITE
    // ==========================================

    resultado =
      resultado.slice(0, 10);


    res.json(resultado);


  } catch (error) {

    console.error(
      'ERRO AO BUSCAR TIMES NO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error: 'Erro ao buscar times',

      details: error.message

    });

  }

});


// ======================================================
// GET /PROXIMO-JOGO
// ======================================================

app.get('/proximo-jogo', async (req, res) => {

  try {

    // ==========================================
    // LER JOGOS
    // ==========================================

    const jogosResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: SPREADSHEET_ID,

        range: 'jogos!A1:H1000'

      });

    const jogosRows =
      jogosResponse.data.values || [];

    const jogos =
      jogosRows.slice(1);


    // ==========================================
    // LER TIMES
    // ==========================================

    const timesResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: SPREADSHEET_ID,

        range: 'times!A1:C1000'

      });

    const timesRows =
      timesResponse.data.values || [];

    const times =
      timesRows.slice(1);


    // ==========================================
    // MAPA DOS TIMES
    // ==========================================

    const timesMap =
      new Map();

    times.forEach(time => {

      const id =
        Number(time[0]);

      timesMap.set(id, {

        id,

        nome:
          time[1] || '',

        logo:
          time[2] || ''

      });

    });


    // ==========================================
    // DATA ATUAL
    // ==========================================

    const agora =
      new Date();


    // ==========================================
    // ENCONTRAR PRÓXIMO JOGO
    // ==========================================

    const proximosJogos = jogos

      .map(jogo => {

        const id =
          Number(jogo[0]);

        const timeCasaId =
          Number(jogo[1]);

        const timeForaId =
          Number(jogo[2]);

        const dataJogo =
          jogo[5] || '';

        const local =
          jogo[6] || '';

        const status =
          jogo[7] || '';


        const dataConvertida =
          new Date(
            dataJogo.replace(
              ' ',
              'T'
            )
          );


        const timeCasa =
          timesMap.get(
            timeCasaId
          );

        const timeFora =
          timesMap.get(
            timeForaId
          );


        return {

          id,

          time_casa:
            timeCasa
              ? timeCasa.nome
              : '',

          time_fora:
            timeFora
              ? timeFora.nome
              : '',

          logo_casa:
            timeCasa
              ? timeCasa.logo
              : '',

          logo_fora:
            timeFora
              ? timeFora.logo
              : '',

          data_jogo:
            dataJogo,

          dataConvertida,

          local,

          status

        };

      })


      .filter(jogo => {

        return (

          jogo.status ===
          'agendado'

          &&

          jogo.dataConvertida >=
          agora

        );

      })


      .sort((a, b) => {

        return (

          a.dataConvertida -
          b.dataConvertida

        );

      });


    // ==========================================
    // NENHUM JOGO
    // ==========================================

    if (
      proximosJogos.length === 0
    ) {

      return res.json(null);

    }


    // ==========================================
    // RETORNAR PRÓXIMO
    // ==========================================

    const proximo =
      proximosJogos[0];

    delete proximo.dataConvertida;

    res.json(proximo);


  } catch (error) {

    console.error(
      'ERRO AO BUSCAR PRÓXIMO JOGO NO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error:
        'Erro ao buscar próximo jogo',

      details:
        error.message

    });

  }

});


// ======================================================
// POST /JOGOS
// ======================================================

app.post('/jogos', auth, async (req, res) => {

  try {

    const {

      time_casa_id,

      time_fora_id,

      gols_casa,

      gols_fora,

      data_jogo,

      local,

      status

    } = req.body;


    // ==========================================
    // VALIDAR CAMPOS
    // ==========================================

    if (

      time_casa_id === undefined ||

      time_fora_id === undefined ||

      !data_jogo ||

      !status

    ) {

      return res.status(400).json({

        error:
          'Campos obrigatórios não informados'

      });

    }


    // ==========================================
    // VALIDAR TIMES
    // ==========================================

    if (

      Number(time_casa_id) ===
      Number(time_fora_id)

    ) {

      return res.status(400).json({

        error:
          'Os dois times não podem ser iguais'

      });

    }


    // ==========================================
    // GERAR ID
    // ==========================================

    const id =
      await gerarProximoIdJogos();


    // ==========================================
    // INSERIR GOOGLE SHEETS
    // ==========================================

    await appendRows(

      'jogos!A:H',

      [[

        id,

        Number(time_casa_id),

        Number(time_fora_id),

        Number(gols_casa || 0),

        Number(gols_fora || 0),

        data_jogo,

        local || '',

        status

      ]]

    );


    res.status(201).json({

      success: true,

      message:
        'Jogo cadastrado com sucesso',

      id

    });


  } catch (error) {

    console.error(
      'ERRO AO CADASTRAR JOGO NO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error:
        'Erro ao cadastrar jogo',

      details:
        error.message

    });

  }

});


// ======================================================
// PUT /JOGOS/:ID
// ======================================================

app.put('/jogos/:id', auth, async (req, res) => {

  try {

    const id =
      Number(req.params.id);


    if (isNaN(id)) {

      return res.status(400).json({

        error:
          'ID do jogo inválido'

      });

    }


    const {

      time_casa_id,

      time_fora_id,

      gols_casa,

      gols_fora,

      data_jogo,

      local,

      status

    } = req.body;


    // ==========================================
    // LER JOGOS
    // ==========================================

    const rows =
      await getValues(
        'jogos!A2:H1000'
      );


    // ==========================================
    // LOCALIZAR
    // ==========================================

    const index =
      rows.findIndex(row => {

        return (
          Number(row[0]) === id
        );

      });


    if (index === -1) {

      return res.status(404).json({

        error:
          'Jogo não encontrado'

      });

    }


    const linha =
      index + 2;


    const jogoAtual =
      rows[index];


    // ==========================================
    // MANTER DADOS EXISTENTES
    // ==========================================

    const novoTimeCasaId =
      time_casa_id !== undefined

        ? Number(time_casa_id)

        : Number(jogoAtual[1]);


    const novoTimeForaId =
      time_fora_id !== undefined

        ? Number(time_fora_id)

        : Number(jogoAtual[2]);


    const novosGolsCasa =
      gols_casa !== undefined

        ? Number(gols_casa)

        : Number(jogoAtual[3] || 0);


    const novosGolsFora =
      gols_fora !== undefined

        ? Number(gols_fora)

        : Number(jogoAtual[4] || 0);


    const novaData =
      data_jogo !== undefined

        ? data_jogo

        : jogoAtual[5] || '';


    const novoLocal =
      local !== undefined

        ? local

        : jogoAtual[6] || '';


    const novoStatus =
      status !== undefined

        ? status

        : jogoAtual[7] || '';


    // ==========================================
    // VALIDAR TIMES
    // ==========================================

    if (
      novoTimeCasaId ===
      novoTimeForaId
    ) {

      return res.status(400).json({

        error:
          'Os dois times não podem ser iguais'

      });

    }


    // ==========================================
    // ATUALIZAR
    // ==========================================

    await updateRange(

      `jogos!A${linha}:H${linha}`,

      [[

        id,

        novoTimeCasaId,

        novoTimeForaId,

        novosGolsCasa,

        novosGolsFora,

        novaData,

        novoLocal,

        novoStatus

      ]]

    );


    res.json({

      success: true,

      message:
        'Jogo atualizado com sucesso',

      id

    });


  } catch (error) {

    console.error(
      'ERRO AO ATUALIZAR JOGO NO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error:
        'Erro ao atualizar jogo',

      details:
        error.message

    });

  }

});


// ======================================================
// DELETE /JOGOS/:ID
// ======================================================

app.delete('/jogos/:id', auth, async (req, res) => {

  try {

    const id =
      Number(req.params.id);


    if (isNaN(id)) {

      return res.status(400).json({

        error:
          'ID do jogo inválido'

      });

    }


    // ==========================================
    // LER JOGOS
    // ==========================================

    const rows =
      await getValues(
        'jogos!A2:H1000'
      );


    // ==========================================
    // LOCALIZAR JOGO
    // ==========================================

    const index =
      rows.findIndex(row => {

        return (
          Number(row[0]) === id
        );

      });


    if (index === -1) {

      return res.status(404).json({

        error:
          'Jogo não encontrado'

      });

    }


    // ==========================================
    // LINHA DA PLANILHA
    // ==========================================

    const linha =
      index + 2;


    // ==========================================
    // OBTER ABA JOGOS
    // ==========================================

    const spreadsheet =
      await sheets.spreadsheets.get({

        spreadsheetId:
          SPREADSHEET_ID,

        fields:
          'sheets.properties'

      });


    const jogosSheet =
      spreadsheet.data.sheets.find(
        sheet =>
          sheet.properties.title ===
          'jogos'
      );


    if (!jogosSheet) {

      return res.status(500).json({

        error:
          'A aba jogos não foi encontrada'

      });

    }


    const sheetId =
      jogosSheet.properties.sheetId;


    // ==========================================
    // EXCLUIR LINHA
    // ==========================================

    await sheets.spreadsheets.batchUpdate({

      spreadsheetId:
        SPREADSHEET_ID,

      requestBody: {

        requests: [

          {

            deleteDimension: {

              range: {

                sheetId,

                dimension: 'ROWS',

                startIndex:
                  linha - 1,

                endIndex:
                  linha

              }

            }

          }

        ]

      }

    });


    res.json({

      success: true,

      message:
        'Jogo excluído com sucesso',

      id

    });


  } catch (error) {

    console.error(
      'ERRO AO EXCLUIR JOGO DO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      error:
        'Erro ao excluir jogo',

      details:
        error.message

    });

  }

});


// ======================================================
// POST /LOGIN
// ======================================================

app.post('/login', async (req, res) => {

  try {

    const {
      email,
      senha
    } = req.body;


    // ==========================================
    // VALIDAR DADOS
    // ==========================================

    if (!email || !senha) {

      return res.status(400).json({

        error:
          'E-mail e senha são obrigatórios'

      });

    }


    // ==========================================
    // VERIFICAR E-MAIL
    // ==========================================

    if (

      email
        .trim()
        .toLowerCase()

      !==

      process.env.ADMIN_EMAIL
        .trim()
        .toLowerCase()

    ) {

      return res.status(401).json({

        error:
          'Usuário ou senha inválidos'

      });

    }


    // ==========================================
    // VERIFICAR SENHA
    // ==========================================

    const senhaValida =
      await bcrypt.compare(

        senha,

        process.env.ADMIN_PASSWORD_HASH

      );


    if (!senhaValida) {

      return res.status(401).json({

        error:
          'Usuário ou senha inválidos'

      });

    }


    // ==========================================
    // GERAR JWT
    // ==========================================

    const token =
      jwt.sign(

        {

          email:
            process.env.ADMIN_EMAIL,

          role:
            'admin'

        },

        process.env.JWT_SECRET,

        {

          expiresIn:
            '1d'

        }

      );


    // ==========================================
    // RETORNAR
    // ==========================================

    res.json({

      token

    });


  } catch (err) {

    console.error(
      'ERRO NO LOGIN:',
      err
    );

    res.status(500).json({

      error:
        'Erro ao realizar login'

    });

  }

});


// ======================================================
// TESTE GOOGLE SHEETS
// ======================================================

app.get('/teste-google', async (req, res) => {

  try {

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          SPREADSHEET_ID,

        range:
          'jogos!A1:H10'

      });


    res.json({

      success: true,

      spreadsheetId:
        SPREADSHEET_ID,

      values:
        response.data.values || []

    });


  } catch (error) {

    console.error(
      'ERRO GOOGLE SHEETS:',
      error
    );

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});


// ======================================================
// TESTE GOOGLE SHEETS - TIMES
// ======================================================

app.get('/teste-google/times', async (req, res) => {

  try {

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          SPREADSHEET_ID,

        range:
          'times!A1:C100'

      });


    res.json({

      success: true,

      values:
        response.data.values || []

    });


  } catch (error) {

    console.error(
      'ERRO GOOGLE SHEETS TIMES:',
      error
    );

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});


// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor rodando na porta ' + PORT);
  });
}

module.exports = app;