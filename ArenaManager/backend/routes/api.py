"""Rotas da API do ArenaManager."""
from flask import Blueprint, jsonify, request

from database import get_db
from services.classificacao import calcular_classificacao, calcular_estatisticas

api = Blueprint("api", __name__, url_prefix="/api")

MODALIDADES = ("futebol", "futsal")


def erro(mensagem, status=400):
    return jsonify({"erro": mensagem}), status


def corpo():
    return request.get_json(silent=True) or {}


def linhas(cursor):
    return [dict(r) for r in cursor.fetchall()]


def existe(db, tabela, id_):
    return db.execute(f"SELECT 1 FROM {tabela} WHERE id = ?", (id_,)).fetchone() is not None


# ---------------------------------------------------------------- campeonatos
@api.get("/campeonatos")
def listar_campeonatos():
    return jsonify(linhas(get_db().execute("SELECT * FROM campeonatos ORDER BY id DESC")))


@api.post("/campeonatos")
def criar_campeonato():
    d = corpo()
    nome = (d.get("nome") or "").strip()
    modalidade = d.get("modalidade")
    if not nome:
        return erro("Informe o nome do campeonato.")
    if modalidade not in MODALIDADES:
        return erro("A modalidade deve ser futebol ou futsal.")
    db = get_db()
    cur = db.execute("INSERT INTO campeonatos (nome, modalidade) VALUES (?, ?)", (nome, modalidade))
    db.commit()
    return jsonify({"id": cur.lastrowid, "nome": nome, "modalidade": modalidade}), 201


@api.get("/campeonatos/<int:id_>")
def obter_campeonato(id_):
    linha = get_db().execute("SELECT * FROM campeonatos WHERE id = ?", (id_,)).fetchone()
    return jsonify(dict(linha)) if linha else erro("Campeonato não encontrado.", 404)


@api.put("/campeonatos/<int:id_>")
def editar_campeonato(id_):
    db = get_db()
    atual = db.execute("SELECT * FROM campeonatos WHERE id = ?", (id_,)).fetchone()
    if not atual:
        return erro("Campeonato não encontrado.", 404)
    d = corpo()
    nome = (d.get("nome", atual["nome"]) or "").strip()
    modalidade = d.get("modalidade", atual["modalidade"])
    if not nome:
        return erro("Informe o nome do campeonato.")
    if modalidade not in MODALIDADES:
        return erro("A modalidade deve ser futebol ou futsal.")
    db.execute("UPDATE campeonatos SET nome = ?, modalidade = ? WHERE id = ?", (nome, modalidade, id_))
    db.commit()
    return jsonify({"id": id_, "nome": nome, "modalidade": modalidade})


@api.delete("/campeonatos/<int:id_>")
def excluir_campeonato(id_):
    db = get_db()
    if not existe(db, "campeonatos", id_):
        return erro("Campeonato não encontrado.", 404)
    db.execute("DELETE FROM campeonatos WHERE id = ?", (id_,))
    db.commit()
    return "", 204


# -------------------------------------------------------------------- equipes
@api.get("/equipes")
def listar_equipes():
    campeonato_id = request.args.get("campeonato_id", type=int)
    db = get_db()
    if campeonato_id:
        cur = db.execute("SELECT * FROM equipes WHERE campeonato_id = ? ORDER BY nome", (campeonato_id,))
    else:
        cur = db.execute("SELECT * FROM equipes ORDER BY nome")
    return jsonify(linhas(cur))


@api.post("/equipes")
def criar_equipe():
    d = corpo()
    nome = (d.get("nome") or "").strip()
    campeonato_id = d.get("campeonato_id")
    db = get_db()
    if not nome:
        return erro("Informe o nome da equipe.")
    if not existe(db, "campeonatos", campeonato_id):
        return erro("Campeonato não encontrado.")
    repetida = db.execute(
        "SELECT 1 FROM equipes WHERE campeonato_id = ? AND lower(nome) = lower(?)", (campeonato_id, nome)
    ).fetchone()
    if repetida:
        return erro("Já existe uma equipe com esse nome neste campeonato.")
    cur = db.execute("INSERT INTO equipes (nome, campeonato_id) VALUES (?, ?)", (nome, campeonato_id))
    db.commit()
    return jsonify({"id": cur.lastrowid, "nome": nome, "campeonato_id": campeonato_id}), 201


@api.put("/equipes/<int:id_>")
def editar_equipe(id_):
    db = get_db()
    if not existe(db, "equipes", id_):
        return erro("Equipe não encontrada.", 404)
    nome = (corpo().get("nome") or "").strip()
    if not nome:
        return erro("Informe o nome da equipe.")
    db.execute("UPDATE equipes SET nome = ? WHERE id = ?", (nome, id_))
    db.commit()
    return jsonify({"id": id_, "nome": nome})


@api.delete("/equipes/<int:id_>")
def excluir_equipe(id_):
    db = get_db()
    if not existe(db, "equipes", id_):
        return erro("Equipe não encontrada.", 404)
    db.execute("DELETE FROM equipes WHERE id = ?", (id_,))
    db.commit()
    return "", 204


# -------------------------------------------------------------------- partidas
SELECT_PARTIDAS = """
    SELECT p.*, m.nome AS mandante, v.nome AS visitante
    FROM partidas p
    JOIN equipes m ON m.id = p.mandante_id
    JOIN equipes v ON v.id = p.visitante_id
"""


def validar_gols(d):
    """Retorna (gols_mandante, gols_visitante, mensagem_de_erro)."""
    gm, gv = d.get("gols_mandante"), d.get("gols_visitante")
    if gm is None and gv is None:
        return None, None, None
    if gm is None or gv is None:
        return None, None, "Informe os gols dos dois times ou deixe os dois vazios."
    if not all(isinstance(g, int) and not isinstance(g, bool) and g >= 0 for g in (gm, gv)):
        return None, None, "Os gols devem ser números inteiros iguais ou maiores que zero."
    return gm, gv, None


@api.get("/partidas")
def listar_partidas():
    campeonato_id = request.args.get("campeonato_id", type=int)
    db = get_db()
    if campeonato_id:
        cur = db.execute(SELECT_PARTIDAS + " WHERE p.campeonato_id = ? ORDER BY p.data, p.horario", (campeonato_id,))
    else:
        cur = db.execute(SELECT_PARTIDAS + " ORDER BY p.data, p.horario")
    return jsonify(linhas(cur))


@api.post("/partidas")
def criar_partida():
    d = corpo()
    db = get_db()
    campeonato_id, mandante_id, visitante_id = d.get("campeonato_id"), d.get("mandante_id"), d.get("visitante_id")
    data, horario = (d.get("data") or "").strip(), (d.get("horario") or "").strip()

    if not data or not horario:
        return erro("Informe a data e o horário da partida.")
    if mandante_id == visitante_id:
        return erro("Uma equipe não pode jogar contra ela mesma.")
    for equipe_id in (mandante_id, visitante_id):
        ok = db.execute(
            "SELECT 1 FROM equipes WHERE id = ? AND campeonato_id = ?", (equipe_id, campeonato_id)
        ).fetchone()
        if not ok:
            return erro("As duas equipes precisam pertencer ao campeonato escolhido.")
    gm, gv, mensagem = validar_gols(d)
    if mensagem:
        return erro(mensagem)

    cur = db.execute(
        """INSERT INTO partidas (campeonato_id, mandante_id, visitante_id, data, horario, gols_mandante, gols_visitante)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (campeonato_id, mandante_id, visitante_id, data, horario, gm, gv),
    )
    db.commit()
    return jsonify({"id": cur.lastrowid}), 201


@api.put("/partidas/<int:id_>")
def editar_partida(id_):
    """Usado principalmente para registrar/atualizar o placar."""
    db = get_db()
    atual = db.execute("SELECT * FROM partidas WHERE id = ?", (id_,)).fetchone()
    if not atual:
        return erro("Partida não encontrada.", 404)
    d = corpo()
    data = (d.get("data", atual["data"]) or "").strip()
    horario = (d.get("horario", atual["horario"]) or "").strip()
    if not data or not horario:
        return erro("Informe a data e o horário da partida.")
    gm, gv, mensagem = validar_gols(d if ("gols_mandante" in d or "gols_visitante" in d) else dict(atual))
    if mensagem:
        return erro(mensagem)
    db.execute(
        "UPDATE partidas SET data = ?, horario = ?, gols_mandante = ?, gols_visitante = ? WHERE id = ?",
        (data, horario, gm, gv, id_),
    )
    db.commit()
    return jsonify({"id": id_})


@api.delete("/partidas/<int:id_>")
def excluir_partida(id_):
    db = get_db()
    if not existe(db, "partidas", id_):
        return erro("Partida não encontrada.", 404)
    db.execute("DELETE FROM partidas WHERE id = ?", (id_,))
    db.commit()
    return "", 204


# ------------------------------------------------- classificação e estatísticas
@api.get("/campeonatos/<int:id_>/classificacao")
def classificacao(id_):
    db = get_db()
    if not existe(db, "campeonatos", id_):
        return erro("Campeonato não encontrado.", 404)
    return jsonify(calcular_classificacao(db, id_))


@api.get("/campeonatos/<int:id_>/estatisticas")
def estatisticas(id_):
    db = get_db()
    if not existe(db, "campeonatos", id_):
        return erro("Campeonato não encontrado.", 404)
    return jsonify(calcular_estatisticas(db, id_))
