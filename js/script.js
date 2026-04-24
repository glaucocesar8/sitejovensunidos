const API_URL = 'sitejovensunidos-production.up.railway.app';

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

// 🔥 GARANTE QUE O DOM CARREGOU
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

    // 🔥 LIMPA O ID SEMPRE QUE DIGITA
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

// 🔥 FILTRO
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
  fetch('http://localhost:3000/proximo-jogo')
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

      // data formatada
      const data = new Date(jogo.data_jogo);

      const dataFormatada = data.toLocaleDateString('pt-BR');
      const hora = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      document.getElementById('infoJogo').innerText =
        `📅 ${dataFormatada} • ⏰ ${hora} • 📍 ${jogo.local}`;
    });
}

// chama ao carregar
document.addEventListener('DOMContentLoaded', carregarProximoJogo);