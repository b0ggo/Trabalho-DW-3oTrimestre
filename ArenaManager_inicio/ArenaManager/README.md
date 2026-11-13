# ArenaManager

Sistema web para organizar campeonatos de futebol e futsal (Trabalho Final de Desenvolvimento Web II).


## Tecnologias
- Front-end: HTML, CSS e JavaScript
- Back-end: Python + Flask
- Banco de dados: SQLite

## Como rodar localmente

### 1. Back-end (API)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate     |     Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python app.py
```
A API fica em `http://127.0.0.1:5000/api` e o arquivo do banco (`arenamanager.db`) é criado automaticamente.

### 2. Front-end
Em outro terminal:
```bash
cd frontend
python -m http.server 5500
```
Abra `http://127.0.0.1:5500` no navegador.

## Rotas da API
| Recurso | Rotas |
| --- | --- |
| Campeonatos | `GET/POST /api/campeonatos` · `GET/PUT/DELETE /api/campeonatos/<id>` |
| Equipes | `GET/POST /api/equipes` (`?campeonato_id=`) · `PUT/DELETE /api/equipes/<id>` |
| Partidas | `GET/POST /api/partidas` (`?campeonato_id=`) · `PUT/DELETE /api/partidas/<id>` |
| Classificação | `GET /api/campeonatos/<id>/classificacao` |
| Estatísticas | `GET /api/campeonatos/<id>/estatisticas` |


