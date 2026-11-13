// Comunicação com o back-end Flask.
// Ao publicar, troque o endereço abaixo pela URL pública da API.
const API_URL = "http://127.0.0.1:5000/api";

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

const Api = {
  get: (caminho) => requisitar(caminho),
  post: (caminho, corpo) => requisitar(caminho, { method: "POST", body: JSON.stringify(corpo) }),
  put: (caminho, corpo) => requisitar(caminho, { method: "PUT", body: JSON.stringify(corpo) }),
  del: (caminho) => requisitar(caminho, { method: "DELETE" }),
};
