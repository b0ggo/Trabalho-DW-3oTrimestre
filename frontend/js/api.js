// =============================================================================
// Camada de dados do ArenaManager.
//
// Existem dois modos de funcionamento (troque a constante MODO):
//   "local" -> os dados ficam salvos no navegador (localStorage). Não precisa de
//              servidor e funciona no GitHub Pages. É o modo usado na versão publicada.
//   "api"   -> o site conversa com o back-end Flask (pasta /backend) em API_URL.
//              Use rodando localmente: python app.py
//
// As páginas (main.js) usam sempre o objeto Api e não precisam saber o modo.
// =============================================================================
const MODO = "local";
const API_URL = "http://127.0.0.1:5000/api";

// ----------------------------------------------------------------- modo "api"
async function requisitar(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      headers: { "Content-Type": "application/json" },
      ...opcoes,
    });
  } catch (e) {
    throw new Error("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
  }
  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Erro ao processar a solicitação.");
  return dados;
}

const ApiServidor = {
  get: (caminho) => requisitar(caminho),
  post: (caminho, corpo) => requisitar(caminho, { method: "POST", body: JSON.stringify(corpo) }),
  put: (caminho, corpo) => requisitar(caminho, { method: "PUT", body: JSON.stringify(corpo) }),
  del: (caminho) => requisitar(caminho, { method: "DELETE" }),
};

// ---------------------------------------------------------------- modo "local"
// Mesmas regras de validação e de cálculo do back-end Flask, em JavaScript.
const CHAVE_DADOS = "arenamanager:dados";

const vazio = () => ({ seq: { campeonatos: 1, equipes: 1, partidas: 1 }, campeonatos: [], equipes: [], partidas: [] });

const EXEMPLO = {
  seq: { campeonatos: 3, equipes: 8, partidas: 7 },
  campeonatos: [
    { id: 1, nome: "Copa Arena 2026", modalidade: "futsal" },
    { id: 2, nome: "Liga Escolar de Futebol", modalidade: "futebol" },
  ],
  equipes: [
    { id: 1, nome: "Tigres", campeonato_id: 1 }, { id: 2, nome: "Falcões", campeonato_id: 1 },
    { id: 3, nome: "Leões", campeonato_id: 1 }, { id: 4, nome: "Águias", campeonato_id: 1 },
    { id: 5, nome: "Colégio Central", campeonato_id: 2 }, { id: 6, nome: "Escola Norte", campeonato_id: 2 },
    { id: 7, nome: "Instituto Sul", campeonato_id: 2 },
  ],
  partidas: [
    { id: 1, campeonato_id: 1, mandante_id: 1, visitante_id: 2, data: "2026-11-07", horario: "19:00", gols_mandante: 3, gols_visitante: 1 },
    { id: 2, campeonato_id: 1, mandante_id: 3, visitante_id: 4, data: "2026-11-08", horario: "20:00", gols_mandante: 2, gols_visitante: 2 },
    { id: 3, campeonato_id: 1, mandante_id: 1, visitante_id: 3, data: "2026-11-10", horario: "19:00", gols_mandante: 1, gols_visitante: 0 },
    { id: 4, campeonato_id: 1, mandante_id: 2, visitante_id: 4, data: "2026-11-12", horario: "20:30", gols_mandante: 4, gols_visitante: 3 },
    { id: 5, campeonato_id: 1, mandante_id: 1, visitante_id: 4, data: "2026-11-15", horario: "19:00", gols_mandante: null, gols_visitante: null },
    { id: 6, campeonato_id: 1, mandante_id: 2, visitante_id: 3, data: "2026-11-16", horario: "20:30", gols_mandante: null, gols_visitante: null },
  ],
};


const falha = (m) => { throw new Error(m); };
const copia = (x) => JSON.parse(JSON.stringify(x));
const achar = (lista, id) => lista.find((x) => x.id === id);
const golsOk = (g) => Number.isInteger(g) && g >= 0;

function validarGols(gm, gv) {
  if (gm == null && gv == null) return;
  if (gm == null || gv == null) falha("Informe os gols dos dois times ou deixe os dois vazios.");
  if (!golsOk(gm) || !golsOk(gv)) falha("Os gols devem ser números inteiros iguais ou maiores que zero.");
}

function classificar(cid) {
  const t = {};
  DB.equipes.filter((e) => e.campeonato_id === cid).forEach((e) => {
    t[e.id] = { equipe_id: e.id, equipe: e.nome, pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gols_pro: 0, gols_contra: 0, saldo: 0 };
  });
  DB.partidas.filter((p) => p.campeonato_id === cid && p.gols_mandante !== null).forEach((p) => {
    const a = t[p.mandante_id], b = t[p.visitante_id], gm = p.gols_mandante, gv = p.gols_visitante;
    [[a, gm, gv], [b, gv, gm]].forEach(([x, pro, contra]) => { x.jogos++; x.gols_pro += pro; x.gols_contra += contra; });
    if (gm > gv) { a.vitorias++; a.pontos += 3; b.derrotas++; }
    else if (gm < gv) { b.vitorias++; b.pontos += 3; a.derrotas++; }
    else { a.empates++; b.empates++; a.pontos++; b.pontos++; }
  });
  Object.values(t).forEach((x) => (x.saldo = x.gols_pro - x.gols_contra));
  return Object.values(t).sort((x, y) => y.pontos - x.pontos || y.vitorias - x.vitorias || y.saldo - x.saldo || y.gols_pro - x.gols_pro || x.equipe.localeCompare(y.equipe));
}

function estatisticas(cid) {
  const tab = classificar(cid), jogou = tab.filter((x) => x.jogos > 0);
  const gols = tab.reduce((s, x) => s + x.gols_pro, 0), n = tab.reduce((s, x) => s + x.jogos, 0) / 2;
  const ataque = [...jogou].sort((x, y) => y.gols_pro - x.gols_pro)[0];
  const defesa = [...jogou].sort((x, y) => x.gols_contra - y.gols_contra)[0];
  return {
    partidas_realizadas: n, total_gols: gols, media_gols: n ? Math.round((gols / n) * 100) / 100 : 0,
    melhor_ataque: ataque ? { equipe: ataque.equipe, gols: ataque.gols_pro } : null,
    melhor_defesa: defesa ? { equipe: defesa.equipe, gols: defesa.gols_contra } : null,
  };
}

function rota(metodo, caminho, corpo = {}) {
  const url = new URL(caminho, "http://x");
  const [recurso, idTxt, sub] = url.pathname.split("/").filter(Boolean);
  const id = idTxt ? Number(idTxt) : null;
  const q = Number(url.searchParams.get("campeonato_id")) || null;

  if (recurso === "campeonatos") {
    if (sub === "classificacao") return classificar(id);
    if (sub === "estatisticas") return estatisticas(id);
    if (metodo === "GET") return [...DB.campeonatos].sort((a, b) => b.id - a.id);
    if (metodo === "POST") {
      const nome = (corpo.nome || "").trim();
      if (!nome) falha("Informe o nome do campeonato.");
      if (!["futebol", "futsal"].includes(corpo.modalidade)) falha("A modalidade deve ser futebol ou futsal.");
      const novo = { id: DB.seq.campeonatos++, nome, modalidade: corpo.modalidade };
      DB.campeonatos.push(novo); return novo;
    }
    const c = achar(DB.campeonatos, id) || falha("Campeonato não encontrado.");
    if (metodo === "PUT") { const nome = (corpo.nome || "").trim(); if (!nome) falha("Informe o nome do campeonato."); c.nome = nome; return c; }
    DB.campeonatos = DB.campeonatos.filter((x) => x.id !== id);
    DB.equipes = DB.equipes.filter((x) => x.campeonato_id !== id);
    DB.partidas = DB.partidas.filter((x) => x.campeonato_id !== id);
    return null;
  }

  if (recurso === "equipes") {
    if (metodo === "GET") return DB.equipes.filter((e) => !q || e.campeonato_id === q).sort((a, b) => a.nome.localeCompare(b.nome));
    if (metodo === "POST") {
      const nome = (corpo.nome || "").trim();
      if (!nome) falha("Informe o nome da equipe.");
      if (!achar(DB.campeonatos, corpo.campeonato_id)) falha("Campeonato não encontrado.");
      if (DB.equipes.some((e) => e.campeonato_id === corpo.campeonato_id && e.nome.toLowerCase() === nome.toLowerCase())) falha("Já existe uma equipe com esse nome neste campeonato.");
      const nova = { id: DB.seq.equipes++, nome, campeonato_id: corpo.campeonato_id };
      DB.equipes.push(nova); return nova;
    }
    const e = achar(DB.equipes, id) || falha("Equipe não encontrada.");
    if (metodo === "PUT") { const nome = (corpo.nome || "").trim(); if (!nome) falha("Informe o nome da equipe."); e.nome = nome; return e; }
    DB.equipes = DB.equipes.filter((x) => x.id !== id);
    DB.partidas = DB.partidas.filter((p) => p.mandante_id !== id && p.visitante_id !== id);
    return null;
  }

  if (recurso === "partidas") {
    if (metodo === "GET") {
      const nome = (i) => achar(DB.equipes, i).nome;
      return DB.partidas.filter((p) => !q || p.campeonato_id === q)
        .map((p) => ({ ...p, mandante: nome(p.mandante_id), visitante: nome(p.visitante_id) }))
        .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
    }
    if (metodo === "POST") {
      if (!corpo.data || !corpo.horario) falha("Informe a data e o horário da partida.");
      if (corpo.mandante_id === corpo.visitante_id) falha("Uma equipe não pode jogar contra ela mesma.");
      [corpo.mandante_id, corpo.visitante_id].forEach((i) => {
        const e = achar(DB.equipes, i);
        if (!e || e.campeonato_id !== corpo.campeonato_id) falha("As duas equipes precisam pertencer ao campeonato escolhido.");
      });
      const nova = { id: DB.seq.partidas++, campeonato_id: corpo.campeonato_id, mandante_id: corpo.mandante_id, visitante_id: corpo.visitante_id, data: corpo.data, horario: corpo.horario, gols_mandante: null, gols_visitante: null };
      DB.partidas.push(nova); return nova;
    }
    const p = achar(DB.partidas, id) || falha("Partida não encontrada.");
    if (metodo === "PUT") { validarGols(corpo.gols_mandante, corpo.gols_visitante); p.gols_mandante = corpo.gols_mandante ?? null; p.gols_visitante = corpo.gols_visitante ?? null; return p; }
    DB.partidas = DB.partidas.filter((x) => x.id !== id);
    return null;
  }
  falha("Rota não encontrada.");
}


function carregarDados() {
  try {
    const texto = localStorage.getItem(CHAVE_DADOS);
    if (texto) return JSON.parse(texto);
  } catch (e) { /* armazenamento indisponível: começa vazio */ }
  return vazio();
}

function salvarDados() {
  try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(DB)); } catch (e) { /* sem armazenamento */ }
}

let DB = carregarDados();

const ApiLocal = {
  get: async (caminho) => copia(rota("GET", caminho)),
  post: async (caminho, corpo) => { const r = rota("POST", caminho, corpo); salvarDados(); return copia(r); },
  put: async (caminho, corpo) => { const r = rota("PUT", caminho, corpo); salvarDados(); return copia(r); },
  del: async (caminho) => { rota("DELETE", caminho); salvarDados(); return null; },
  carregarExemplo: async () => { DB = copia(EXEMPLO); salvarDados(); },
  limpar: async () => { DB = vazio(); salvarDados(); },
};

const Api = MODO === "local" ? ApiLocal : ApiServidor;
