# ArenaManager

Sistema web para organizar campeonatos de futebol e futsal. Trabalho Final de Desenvolvimento Web II (DW2).

- **Site publicado:** https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
- **Repositório:** https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO

## Integrantes e participação

| Integrante | Participação |
| --- | --- |
| [NOME 1] | [o que fez] |
| [NOME 2] | [o que fez] |
| [NOME 3] | [o que fez] |
| [NOME 4] | [o que fez] |
| [NOME 5] | [o que fez] |
| [NOME 6] | [o que fez] |

## Tema, objetivo e público-alvo

**Tema:** gestão de campeonatos de futebol e futsal.

**Problema:** organizadores de campeonatos pequenos usam anotações e planilhas separadas, o que causa desorganização e erros, principalmente no cálculo da classificação.

**Objetivo:** reunir campeonatos, equipes, partidas, placares, classificação e estatísticas em um só sistema, com a tabela calculada automaticamente.

**Público-alvo:** organizadores de campeonatos amadores, escolares e comunitários, equipes esportivas e pessoas que acompanham os resultados.

## Tecnologias

- HTML, CSS e JavaScript (sem bibliotecas externas); dados salvos no navegador com `localStorage`
- Python, Flask e SQLite (back-end opcional, na pasta `backend/`)
- Git, GitHub e GitHub Pages

## Funcionalidades (requisitos funcionais)

- **RF01** – Cadastrar, listar, editar o nome e excluir campeonatos (futebol ou futsal).
- **RF02** – Cadastrar, listar, editar o nome e excluir equipes de um campeonato.
- **RF03** – Criar e excluir partidas com mandante, visitante, data e horário.
- **RF04** – Registrar e atualizar o placar das partidas.
- **RF05** – Calcular a classificação automaticamente (vitória 3 pontos, empate 1). Desempate: pontos, vitórias, saldo de gols, gols marcados e nome.
- **RF06** – Mostrar estatísticas: partidas com placar, total e média de gols, melhor ataque e melhor defesa.
- **RF07** – Validar os dados: nome obrigatório, equipe não repetida no campeonato, equipe não joga contra ela mesma, gols inteiros e não negativos.

## Características e restrições (requisitos não funcionais)

- **Usabilidade:** menu igual em todas as páginas, avisos de sucesso e erro e confirmação antes de excluir.
- **Responsividade:** layout adaptável ao celular (verificado em 390 px de largura); as tabelas rolam na horizontal.
- **Desempenho:** sem bibliotecas nem fontes externas.
- **Acessibilidade:** campos com rótulo, foco visível e página em `pt-BR`. O contraste não foi medido com ferramenta específica.
- **Segurança:** textos digitados são escapados antes de aparecer na tela e os dados são validados. Não há login.
- **Limitações:** na versão publicada os dados ficam só no navegador de cada pessoa (não são compartilhados); só há campeonatos de pontos corridos.

## Como acessar e usar

1. Abra o link do site publicado.
2. Na página **Início**, clique em "Carregar dados de exemplo" para ver o sistema preenchido, ou comece do zero.
3. Cadastre campeonatos, equipes e partidas, registre os placares e acompanhe a **Classificação** e as **Estatísticas**.

**Uso com o back-end Flask (opcional):** em `frontend/js/api.js`, troque `MODO` para `"api"`. Na pasta `backend`, rode `pip install -r requirements.txt` e `python app.py`. Em outro terminal, na pasta `frontend`, rode `python -m http.server 5500` e abra `http://127.0.0.1:5500`.
