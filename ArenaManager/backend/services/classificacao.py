"""Cálculo da classificação e das estatísticas a partir dos placares."""


def calcular_classificacao(db, campeonato_id):
    equipes = db.execute(
        "SELECT id, nome FROM equipes WHERE campeonato_id = ?", (campeonato_id,)
    ).fetchall()

    tabela = {
        e["id"]: {
            "equipe_id": e["id"], "equipe": e["nome"], "pontos": 0, "jogos": 0,
            "vitorias": 0, "empates": 0, "derrotas": 0,
            "gols_pro": 0, "gols_contra": 0, "saldo": 0,
        }
        for e in equipes
    }

    partidas = db.execute(
        """SELECT mandante_id, visitante_id, gols_mandante, gols_visitante
           FROM partidas
           WHERE campeonato_id = ?
             AND gols_mandante IS NOT NULL AND gols_visitante IS NOT NULL""",
        (campeonato_id,),
    ).fetchall()

    for p in partidas:
        casa, fora = tabela[p["mandante_id"]], tabela[p["visitante_id"]]
        gm, gv = p["gols_mandante"], p["gols_visitante"]

        for time, pro, contra in ((casa, gm, gv), (fora, gv, gm)):
            time["jogos"] += 1
            time["gols_pro"] += pro
            time["gols_contra"] += contra

        if gm > gv:
            casa["vitorias"] += 1; casa["pontos"] += 3; fora["derrotas"] += 1
        elif gm < gv:
            fora["vitorias"] += 1; fora["pontos"] += 3; casa["derrotas"] += 1
        else:
            casa["empates"] += 1; fora["empates"] += 1
            casa["pontos"] += 1; fora["pontos"] += 1

    for time in tabela.values():
        time["saldo"] = time["gols_pro"] - time["gols_contra"]

    # Desempate (SUGESTÃO - o grupo ainda deve confirmar):
    # pontos, vitórias, saldo de gols, gols marcados e, por fim, nome.
    return sorted(
        tabela.values(),
        key=lambda t: (-t["pontos"], -t["vitorias"], -t["saldo"], -t["gols_pro"], t["equipe"]),
    )


def calcular_estatisticas(db, campeonato_id):
    tabela = calcular_classificacao(db, campeonato_id)
    com_jogos = [t for t in tabela if t["jogos"] > 0]
    total_gols = sum(t["gols_pro"] for t in tabela)
    partidas = sum(t["jogos"] for t in tabela) // 2

    melhor_ataque = max(com_jogos, key=lambda t: t["gols_pro"], default=None)
    melhor_defesa = min(com_jogos, key=lambda t: t["gols_contra"], default=None)

    return {
        "partidas_realizadas": partidas,
        "total_gols": total_gols,
        "media_gols": round(total_gols / partidas, 2) if partidas else 0,
        "melhor_ataque": {"equipe": melhor_ataque["equipe"], "gols": melhor_ataque["gols_pro"]} if melhor_ataque else None,
        "melhor_defesa": {"equipe": melhor_defesa["equipe"], "gols": melhor_defesa["gols_contra"]} if melhor_defesa else None,
    }
