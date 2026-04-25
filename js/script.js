const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://sitejovensunidos-production.up.railway.app';

// 🔥 CARREGAR JOGOS INICIAIS
function carregarJogos(url = `${API_URL}/jogos`) {
  fetch(url)
  .then(res => res.json())
  .then(jogos => {    

    const container = document.getElementById('lista-jogos');
    const statsContainer = document.getElementById('estatisticas');    

      container.innerHTML = '';

      jogos.forEach(jogo => {

        const data = new Date(jogo.data_jogo);
        const diaSemana = data
          .toLocaleDateString('pt-BR', { weekday: 'long' })
          .replace(/^\w/, c => c.toUpperCase());
        const dataFormatada = data.toLocaleDateString('pt-BR');

        container.innerHTML += `
          <div class="col-md-4">
            <div class="card result-card p-3">
              
              <div class="teams">
                
                <div class="team">
                  <img src="${jogo.logo_casa}" class="team-logo">
                  <span>${jogo.time_casa}</span>
                </div>

                <div class="score">
                  ${jogo.gols_casa ?? '-'} x ${jogo.gols_fora ?? '-'}
                </div>

                <div class="team">
                  <img src="${jogo.logo_fora}" class="team-logo">
                  <span>${jogo.time_fora}</span>
                </div>

              </div>

              <div class="text-center mt-2">
                <small>
                  📅 ${diaSemana} • ${dataFormatada} • 📍 ${jogo.local}
                </small>
              </div>

            </div>
          </div>
        `;
      });
    });
}

// GARANTE QUE O DOM CARREGOU
document.addEventListener('DOMContentLoaded', () => {

  const input = document.getElementById('adversario_nome');
  const hiddenId = document.getElementById('adversario_id');
  const lista = document.getElementById('sugestoes');

  if (!input) return;

  let timeout;

  input.addEventListener('input', () => {
  clearTimeout(timeout);

  timeout = setTimeout(async () => {
    const termo = input.value.trim();

    // LIMPA O ID SEMPRE QUE DIGITA
    hiddenId.value = '';

    if (termo.length === 0) {
      hiddenId.value = '';
      lista.innerHTML = '';
      return;
    }

    if (termo.length < 2) {
      lista.innerHTML = `
        <li class="list-group-item text-muted">
          Digite pelo menos 2 letras...
        </li>
      `;
      return;
    }

    const res = await fetch(`${API_URL}/times?nome=${termo}`);
    const times = await res.json();

    lista.innerHTML = '';

    if (times.length === 0) {
      lista.innerHTML = `
        <li class="list-group-item text-danger">
          Nenhum time encontrado
        </li>
      `;
      return;
    }

    times.forEach(t => {
      lista.innerHTML += `
        <li class="list-group-item d-flex align-items-center gap-2"
            onclick="selecionarTime(${t.id}, \`${t.nome}\`)">
          <img src="${t.logo}" width="30" height="30">
          <span>${t.nome}</span>
        </li>
      `;
    });

  }, 300);
});

  // expõe global
  window.selecionarTime = function(id, nome) {
    input.value = nome;
    hiddenId.value = id;
    lista.innerHTML = '';
  };

});

// FILTRO
function filtrar() {
  const adversario = document.getElementById('adversario_id').value;
  const resultado = document.getElementById('resultado').value;
  const ano = document.getElementById('ano').value;
  const diaSemana = document.getElementById('diaSemana').value;

  const container = document.getElementById('lista-jogos');

  if (!adversario && !resultado && !ano && !diaSemana) {
    // 🔥 busca tudo
    carregarJogos();
    return;
  }

  const params = new URLSearchParams();

  if (adversario) params.append('adversario', adversario);
  if (resultado) params.append('resultado', resultado);
  if (ano) params.append('ano', ano);
  if (diaSemana) { params.append('diaSemana', diaSemana );
}

  carregarJogos(`${API_URL}/jogos?${params}`);
}

// PRÓXIMO JOGO
function carregarProximoJogo() {
  fetch(`${API_URL}/proximo-jogo`)
    .then(res => res.json())
    .then(jogo => {

      if (!jogo) {
        document.getElementById('infoJogo').innerText = 'Nenhum jogo agendado';
        return;
      }

      // nomes
      document.getElementById('timeFora').innerText = jogo.time_fora;
      document.getElementById('timeCasa').innerText = jogo.time_casa;

      // logos
      document.getElementById('logoFora').src = jogo.logo_fora;
      document.getElementById('logoCasa').src = jogo.logo_casa;

      const dataStr = jogo.data_jogo;

      // 🔥 remove o Z (UTC)
      const semUTC = dataStr.replace('Z', '');

      // cria a data sem conversão de fuso
      const data = new Date(semUTC);

      // pega valores manualmente
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();

      const hora = String(data.getHours()).padStart(2, '0');
      const minuto = String(data.getMinutes()).padStart(2, '0');

      document.getElementById('infoJogo').innerText =
        `📅 ${dia}/${mes}/${ano} • ⏰ ${hora}:${minuto} • 📍 ${jogo.local}`;
    });
}

// chama ao carregar
document.addEventListener('DOMContentLoaded', carregarProximoJogo);

function abrirMenu() {
  document.getElementById('menuLateral').classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

function fecharMenu() {
  document.getElementById('menuLateral').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

document.getElementById('formJogo').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');

  await fetch(`${API_URL}/jogos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
                'Authorization': token
     },
    body: JSON.stringify({
      time_casa_id: document.getElementById('casa').value,
      time_fora_id: document.getElementById('fora').value,
      data_jogo: document.getElementById('data').value,
      local: document.getElementById('local').value,
      status: 'agendado'
    })
  });

  alert('Jogo cadastrado!');
});

async function atualizarJogo(id) {
  await fetch(`${API_URL}/jogos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gols_casa: 2,
      gols_fora: 1,
      status: 'finalizado'
    })
  });
}

function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.sendStatus(403);
  }
}

async function login() {  
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      senha: document.getElementById('senha').value
    })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    alert('Login OK!');
    window.location.href = 'admin.html';
  } else {
    alert('Erro no login');
  }
}
