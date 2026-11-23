"""Conexão com o SQLite e criação das tabelas."""
import os
import sqlite3

from flask import g

DB_PATH = os.path.join(os.path.dirname(__file__), "arenamanager.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS campeonatos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    modalidade TEXT NOT NULL CHECK (modalidade IN ('futebol', 'futsal')),
    formato    TEXT NOT NULL DEFAULT 'pontos corridos'
);

CREATE TABLE IF NOT EXISTS equipes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partidas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    campeonato_id  INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
    mandante_id    INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    visitante_id   INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    data           TEXT NOT NULL,
    horario        TEXT NOT NULL,
    gols_mandante  INTEGER CHECK (gols_mandante  IS NULL OR gols_mandante  >= 0),
    gols_visitante INTEGER CHECK (gols_visitante IS NULL OR gols_visitante >= 0),
    CHECK (mandante_id <> visitante_id)
);
"""


def get_db():
    """Uma conexão por requisição."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(erro=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conexao = sqlite3.connect(DB_PATH)
    conexao.executescript(SCHEMA)
    conexao.commit()
    conexao.close()
