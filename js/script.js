const API_URL =
  window.location.origin.includes('127.0.0.1') ||
  window.location.origin.includes('localhost')
    ? 'http://localhost:3000'
    : window.location.origin;

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
                  <img src="${jogo.logo_fora || 'https://cdn-icons-png.flaticon.com/512/53/53283.png'}" class="team-logo" onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/53/53283.png';">
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
  params.append('status', 'finalizado');
  
  carregarJogos(`${API_URL}/jogos?${params}`);
}

// PRÓXIMO JOGO
// PRÓXIMOS JOGOS

// ==========================================
// PRÓXIMOS JOGOS
// ==========================================

function carregarProximosJogos() {

  fetch(`${API_URL}/proximos-jogos`)

    .then(res => res.json())

    .then(jogos => {

      const container =
        document.getElementById('lista-proximos-jogos');

      if (!container) return;


      // ==========================================
      // DESTRUIR SLICK ANTERIOR
      // ==========================================

      if ($(container).hasClass('slick-initialized')) {

        $(container).slick('unslick');

      }


      // Limpa os cards

      container.innerHTML = '';


      // ==========================================
      // NENHUM JOGO
      // ==========================================

      if (!jogos || jogos.length === 0) {

        container.innerHTML = `
          <div class="next-game-card">

            <div class="text-center">
              Nenhum jogo agendado
            </div>

          </div>
        `;

        return;

      }


      // ==========================================
      // CRIAR OS CARDS
      // ==========================================

      jogos.forEach(jogo => {

        const dataStr =
          jogo.data_jogo || '';


        // Remove Z caso exista

        const semUTC =
          dataStr.replace('Z', '');


        // Mantém o horário da planilha

        const data =
          new Date(
            semUTC.replace(' ', 'T')
          );


        // ==========================================
        // DATA
        // ==========================================

        const dia =
          String(
            data.getDate()
          ).padStart(2, '0');


        const mes =
          String(
            data.getMonth() + 1
          ).padStart(2, '0');


        const ano =
          data.getFullYear();


        // ==========================================
        // HORA
        // ==========================================

        const hora =
          String(
            data.getHours()
          ).padStart(2, '0');


        const minuto =
          String(
            data.getMinutes()
          ).padStart(2, '0');


        // ==========================================
        // CRIAR CARD
        // ==========================================

        const card =
          document.createElement('div');


        card.className =
          'next-game-card';


        card.innerHTML = `

          <span class="next-label">
            PRÓXIMO JOGO
          </span>


          <div class="match">

            <!-- TIME FORA -->

            <div class="team">

              <img
                src="${jogo.logo_fora || ''}"
                class="mini-logo-time-fora"
                onerror="
                  this.onerror=null;
                  this.style.display='none';
                "
              >

              <span>
                ${jogo.time_fora || '-'}
              </span>

            </div>


            <!-- VS -->

            <strong>
              VS
            </strong>


            <!-- TIME CASA -->

            <div class="team">

              <img
                src="${jogo.logo_casa || ''}"
                class="mini-logo"
                onerror="
                  this.onerror=null;
                  this.style.display='none';
                "
              >

              <span>
                ${jogo.time_casa || '-'}
              </span>

            </div>

          </div>


          <!-- INFORMAÇÕES -->

          <div class="match-info">

            <p>
              📅 ${dia}/${mes}/${ano}
              • ⏰ ${hora}:${minuto}
              • 📍 ${jogo.local || '-'}
            </p>

          </div>

        `;


        container.appendChild(card);

      });


      // ==========================================
      // INICIALIZA SLICK
      // ==========================================

      $(container).slick({

        autoplay: true,

        autoplaySpeed: 4000,

        arrows: true,

        dots: true,

        infinite: true,

        slidesToShow: 1,

        slidesToScroll: 1,

        variableWidth: false,

        adaptiveHeight: true,

        swipe: true,

        draggable: true

      });

    })


    // ==========================================
    // ERRO
    // ==========================================

    .catch(error => {

      console.error(
        'Erro ao carregar próximos jogos:',
        error
      );

    });

}


// ==========================================
// CARREGAR QUANDO A PÁGINA ABRIR
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  carregarProximosJogos
);

// chama ao carregar
document.addEventListener(
  'DOMContentLoaded',
  carregarProximosJogos
);

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
                'Authorization': `Bearer ${token}`
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

  const token =
    localStorage.getItem('token');

  const response =
    await fetch(`${API_URL}/jogos/${id}`, {

      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },

      body: JSON.stringify({

        gols_casa: 2,

        gols_fora: 1,

        status: 'finalizado'

      })

    });


  const data =
    await response.json();

  console.log(
    'Atualização:',
    data
  );

}

async function login() {
  try {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    let data;

    try {
      data = await res.json();
    } catch {
      throw new Error('Resposta inválida');
    }

    if (!res.ok) {
      mostrarAlerta(data.error || 'Erro no login', 'danger');
      return;
    }

    // ✅ SUCESSO
    localStorage.setItem('token', data.token);

    mostrarAlerta('Login realizado com sucesso!', 'success');
    
  } catch (err) {
    console.error('ERRO REAL:', err);
    mostrarAlerta('Erro ao conectar com servidor', 'danger');
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

async function carregarJogadores() {
  try {
    const response = await fetch(`${API_URL}/jogadores`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const jogadores = await response.json();

    const container = document.getElementById('lista-jogadores');

    if (!container) return;

    if ($(container).hasClass('slick-initialized')) {
      $(container).slick('unslick');
    }

    container.innerHTML = '';

    jogadores.forEach(jogador => {

    const card = document.createElement('div');

    card.className = 'player-card d-flex align-items-center';

    card.innerHTML = `

      ${
        jogador.foto
          ? `<img
              src="${jogador.foto}"
              class="player-img"
              onerror="this.style.display='none';"
            >`
          : ''
      }

      <div class="player-info ms-3 text-start">

        <h5>${jogador.nome}</h5>

        <span class="position">
          ${jogador.posicao || '-'}
        </span>

        <div class="player-stats mt-2">

          <p>Idade:</p>
          <span>${jogador.idade || '-'}</span>

          <p>Data nascimento:</p>
          <span>${jogador.data_nascimento || '-'}</span>

        </div>

      </div>
    `;

  container.appendChild(card);
});
    

  } catch (error) {
    console.error('Erro ao carregar jogadores:', error);
  }
}
