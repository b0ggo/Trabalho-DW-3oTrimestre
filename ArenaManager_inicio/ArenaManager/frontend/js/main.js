// Lógica das páginas. Cada página informa seu nome em <body data-page="...">.
const PAGINAS = [
  ["index", "Início", "index.html"],
  ["campeonatos", "Campeonatos", "campeonatos.html"],
  ["equipes", "Equipes", "equipes.html"],
  ["partidas", "Partidas", "partidas.html"],
  ["classificacao", "Classificação", "classificacao.html"],
  ["estatisticas", "Estatísticas", "estatisticas.html"],
];

// Evita injetar HTML vindo do usuário.
const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function montarMenu(atual) {
  document.getElementById("menu").innerHTML = PAGINAS.map(
    ([id, nome, href]) => `<a href="${href}"${id === atual ? ' aria-current="page"' : ""}>${nome}</a>`
  ).join("");
}

function avisar(mensagem, ehErro = false) {
  const el = document.getElementById("aviso");
  el.textContent = mensagem;
  el.className = "aviso " + (ehErro ? "erro" : "ok");
  el.hidden = false;
  clearTimeout(avisar.tempo);
  avisar.tempo = setTimeout(() => (el.hidden = true), 4000);
}

async function comAviso(funcao) {
  try {
    await funcao();
  } catch (e) {
    avisar(e.message, true);
  }
}

async function carregarSeletorCampeonatos(select, aoMudar) {
  const lista = await Api.get("/campeonatos");
  select.innerHTML = lista.length
    ? lista.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")
    : '<option value="">Cadastre um campeonato primeiro</option>';
  select.onchange = () => comAviso(aoMudar);
  if (lista.length) await aoMudar();
  return lista;
}

const linhaVazia = (colunas, texto) => `<tr><td colspan="${colunas}" class="vazio">${texto}</td></tr>`;

const paginas = {
  async index() {
    const [campeonatos, equipes, partidas] = await Promise.all([
      Api.get("/campeonatos"), Api.get("/equipes"), Api.get("/partidas"),
    ]);
    document.getElementById("total-campeonatos").textContent = campeonatos.length;
    document.getElementById("total-equipes").textContent = equipes.length;
    document.getElementById("total-partidas").textContent = partidas.length;
    document.getElementById("total-jogadas").textContent = partidas.filter((p) => p.gols_mandante !== null).length;
    document.getElementById("lista-recentes").innerHTML = campeonatos.length
      ? campeonatos.slice(0, 5).map((c) => `<tr><td>${esc(c.nome)}</td><td>${esc(c.modalidade)}</td></tr>`).join("")
      : linhaVazia(2, "Nenhum campeonato ainda. Comece pela página Campeonatos.");
  },

  async campeonatos() {
    const form = document.getElementById("form-campeonato");
    const corpo = document.getElementById("lista");

    async function listar() {
      const lista = await Api.get("/campeonatos");
      corpo.innerHTML = lista.length
        ? lista.map((c) => `<tr>
            <td>${esc(c.nome)}</td><td>${esc(c.modalidade)}</td>
            <td class="acoes">
              <button class="secundario" data-editar="${c.id}" data-nome="${esc(c.nome)}">Editar nome</button>
              <button class="perigo" data-excluir="${c.id}">Excluir</button>
            </td></tr>`).join("")
        : linhaVazia(3, "Nenhum campeonato cadastrado. Use o formulário acima.");
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      comAviso(async () => {
        await Api.post("/campeonatos", { nome: form.nome.value, modalidade: form.modalidade.value });
        form.reset();
        avisar("Campeonato salvo.");
        await listar();
      });
    };

    corpo.onclick = (e) => {
      const botao = e.target.closest("button");
      if (!botao) return;
      comAviso(async () => {
        if (botao.dataset.excluir) {
          if (!confirm("Excluir este campeonato? As equipes e partidas dele também serão excluídas.")) return;
          await Api.del(`/campeonatos/${botao.dataset.excluir}`);
          avisar("Campeonato excluído.");
        } else {
          const nome = prompt("Novo nome do campeonato:", botao.dataset.nome);
          if (!nome) return;
          await Api.put(`/campeonatos/${botao.dataset.editar}`, { nome });
          avisar("Campeonato atualizado.");
        }
        await listar();
      });
    };

    await listar();
  },

  async equipes() {
    const select = document.getElementById("campeonato");
    const form = document.getElementById("form-equipe");
    const corpo = document.getElementById("lista");

    async function listar() {
      if (!select.value) { corpo.innerHTML = linhaVazia(2, "Cadastre um campeonato para adicionar equipes."); return; }
      const lista = await Api.get(`/equipes?campeonato_id=${select.value}`);
      corpo.innerHTML = lista.length
        ? lista.map((t) => `<tr><td>${esc(t.nome)}</td>
            <td class="acoes">
              <button class="secundario" data-editar="${t.id}" data-nome="${esc(t.nome)}">Editar nome</button>
              <button class="perigo" data-excluir="${t.id}">Excluir</button>
            </td></tr>`).join("")
        : linhaVazia(2, "Nenhuma equipe neste campeonato. Use o formulário acima.");
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      comAviso(async () => {
        await Api.post("/equipes", { nome: form.nome.value, campeonato_id: Number(select.value) });
        form.reset();
        avisar("Equipe salva.");
        await listar();
      });
    };

    corpo.onclick = (e) => {
      const botao = e.target.closest("button");
      if (!botao) return;
      comAviso(async () => {
        if (botao.dataset.excluir) {
          if (!confirm("Excluir esta equipe? As partidas dela também serão excluídas.")) return;
          await Api.del(`/equipes/${botao.dataset.excluir}`);
          avisar("Equipe excluída.");
        } else {
          const nome = prompt("Novo nome da equipe:", botao.dataset.nome);
          if (!nome) return;
          await Api.put(`/equipes/${botao.dataset.editar}`, { nome });
          avisar("Equipe atualizada.");
        }
        await listar();
      });
    };

    const lista = await carregarSeletorCampeonatos(select, listar);
    if (!lista.length) await listar();
  },

  async partidas() {
    const select = document.getElementById("campeonato");
    const form = document.getElementById("form-partida");
    const corpo = document.getElementById("lista");

    async function listar() {
      if (!select.value) { corpo.innerHTML = linhaVazia(5, "Cadastre um campeonato e equipes para criar partidas."); return; }
      const [equipes, partidas] = await Promise.all([
        Api.get(`/equipes?campeonato_id=${select.value}`),
        Api.get(`/partidas?campeonato_id=${select.value}`),
      ]);
      const opcoes = equipes.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join("");
      form.mandante.innerHTML = opcoes;
      form.visitante.innerHTML = opcoes;
      corpo.innerHTML = partidas.length
        ? partidas.map((p) => `<tr data-id="${p.id}">
            <td>${esc(p.data)} ${esc(p.horario)}</td>
            <td>${esc(p.mandante)}</td>
            <td class="num">
              <input type="number" min="0" data-gols="m" aria-label="Gols de ${esc(p.mandante)}" value="${p.gols_mandante ?? ""}">
              x
              <input type="number" min="0" data-gols="v" aria-label="Gols de ${esc(p.visitante)}" value="${p.gols_visitante ?? ""}">
            </td>
            <td>${esc(p.visitante)}</td>
            <td class="acoes">
              <button data-salvar="${p.id}">Salvar placar</button>
              <button class="perigo" data-excluir="${p.id}">Excluir</button>
            </td></tr>`).join("")
        : linhaVazia(5, "Nenhuma partida neste campeonato. Use o formulário acima.");
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      comAviso(async () => {
        await Api.post("/partidas", {
          campeonato_id: Number(select.value),
          mandante_id: Number(form.mandante.value),
          visitante_id: Number(form.visitante.value),
          data: form.data.value,
          horario: form.horario.value,
        });
        avisar("Partida salva.");
        await listar();
      });
    };

    corpo.onclick = (e) => {
      const botao = e.target.closest("button");
      if (!botao) return;
      comAviso(async () => {
        if (botao.dataset.excluir) {
          if (!confirm("Excluir esta partida?")) return;
          await Api.del(`/partidas/${botao.dataset.excluir}`);
          avisar("Partida excluída.");
        } else {
          const linha = botao.closest("tr");
          const valor = (v) => (linha.querySelector(`[data-gols="${v}"]`).value === "" ? null : Number(linha.querySelector(`[data-gols="${v}"]`).value));
          await Api.put(`/partidas/${botao.dataset.salvar}`, { gols_mandante: valor("m"), gols_visitante: valor("v") });
          avisar("Placar salvo.");
        }
        await listar();
      });
    };

    const lista = await carregarSeletorCampeonatos(select, listar);
    if (!lista.length) await listar();
  },

  async classificacao() {
    const select = document.getElementById("campeonato");
    const corpo = document.getElementById("lista");

    async function listar() {
      const tabela = await Api.get(`/campeonatos/${select.value}/classificacao`);
      corpo.innerHTML = tabela.length
        ? tabela.map((t, i) => `<tr${i === 0 && t.jogos > 0 ? ' class="lider"' : ""}>
            <td class="num">${i + 1}</td><td>${esc(t.equipe)}</td>
            <td class="num">${t.pontos}</td><td class="num">${t.jogos}</td>
            <td class="num">${t.vitorias}</td><td class="num">${t.empates}</td><td class="num">${t.derrotas}</td>
            <td class="num">${t.gols_pro}</td><td class="num">${t.gols_contra}</td><td class="num">${t.saldo}</td></tr>`).join("")
        : linhaVazia(10, "Este campeonato ainda não tem equipes.");
    }

    const lista = await carregarSeletorCampeonatos(select, listar);
    if (!lista.length) corpo.innerHTML = linhaVazia(10, "Cadastre um campeonato para ver a classificação.");
  },

  async estatisticas() {
    const select = document.getElementById("campeonato");
    const area = document.getElementById("cartoes");
    const cartao = (valor, rotulo) => `<div class="cartao-dado"><strong>${esc(valor)}</strong><span>${esc(rotulo)}</span></div>`;

    async function mostrar() {
      const e = await Api.get(`/campeonatos/${select.value}/estatisticas`);
      area.innerHTML =
        cartao(e.partidas_realizadas, "partidas com placar") +
        cartao(e.total_gols, "gols marcados") +
        cartao(e.media_gols, "gols por partida") +
        cartao(e.melhor_ataque ? `${e.melhor_ataque.equipe} (${e.melhor_ataque.gols})` : "-", "melhor ataque") +
        cartao(e.melhor_defesa ? `${e.melhor_defesa.equipe} (${e.melhor_defesa.gols})` : "-", "melhor defesa");
    }

    const lista = await carregarSeletorCampeonatos(select, mostrar);
    if (!lista.length) area.innerHTML = '<p class="vazio">Cadastre um campeonato para ver as estatísticas.</p>';
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const pagina = document.body.dataset.page;
  montarMenu(pagina);
  comAviso(() => paginas[pagina]());
});
