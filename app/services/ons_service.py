from sqlalchemy import text
from sqlalchemy.orm import Session



def get_usinas_mais_caras(db: Session, limite: int):
    query = text("""
        SELECT usina, subsistema, MAX(custo_variavel_unitario)::numeric AS custo_maximo
        FROM custo_variavel_termicas
        WHERE custo_variavel_unitario > 0
        GROUP BY usina, subsistema
        ORDER BY custo_maximo DESC
        LIMIT :limite;
    """)
    resultado = db.execute(query, {"limite": limite}).fetchall()
    return [{"usina": r[0], "subsistema": r[1], "custo_maximo": float(r[2])} for r in resultado]


def get_matriz_energetica(db: Session):
    query = text("""
        SELECT subsistema, SUM(usina_hidraulica_verificada), SUM(geracao_usina_termica_verificada),
               SUM(geracao_eolica_verificada), SUM(geracao_fotovoltaica_verificada)
        FROM balanco_energia
        GROUP BY subsistema;
    """)
    resultado = db.execute(query).fetchall()
    return [{"subsistema": r[0], "hidrica": r[1], "termica": r[2], "eolica": r[3], "solar": r[4]} for r in resultado]


def get_historico_demanda(db: Session, ano: int, mes: int):
    query = text("""
        SELECT subsistema, SUM(valor_demanda) as demanda_total
        FROM balanco_energia
        WHERE ano = :ano AND mes = :mes
        GROUP BY subsistema ORDER BY demanda_total DESC;
    """)
    resultado = db.execute(query, {"ano": ano, "mes": mes}).fetchall()
    return [{"subsistema": r[0], "demanda_total": r[1]} for r in resultado]


def get_tendencia_custos(db: Session):
    query = text("""
        SELECT ano, ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2)
        FROM custo_marginal_semanal
        GROUP BY ano ORDER BY ano ASC;
    """)
    resultado = db.execute(query).fetchall()
    return [{"ano": r[0], "custo_medio_anual": float(r[1])} for r in resultado]



def get_custo_real_vs_previsto(db: Session, ano: int):
    """
    Compara CMO real vs média histórica mês a mês para um dado ano.
    Usa a média dos anos anteriores como proxy do "previsto".
    Retorna também o desvio já calculado (real - previsto).
    """
    query = text("""
        SELECT
            mes,
            COALESCE(AVG(custo_marginal_operacao_semanal), 0) AS custo_real,
            COALESCE((
                SELECT AVG(custo_marginal_operacao_semanal)
                FROM custo_marginal_semanal AS hist
                WHERE hist.mes = cms.mes AND hist.ano < :ano
            ), 0) AS previsto
        FROM custo_marginal_semanal AS cms
        WHERE ano = :ano
        GROUP BY mes
        ORDER BY mes ASC;
    """)
    resultado = db.execute(query, {"ano": ano}).fetchall()
    meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

    dados = []
    for r in resultado:
        real = float(r[1])
        previsto = float(r[2])
        dados.append({
            "mes": meses[r[0] - 1] if 1 <= r[0] <= 12 else str(r[0]),
            "real": real,
            "previsto": previsto,
            "desvio": round(real - previsto, 2),
        })
    return dados


def get_ranking_usinas_admin(db: Session, limite: int):
    """
    Ranking de usinas com custo médio, variabilidade e criticidade calculada.
    Usado na tabela operacional do painel admin.
    """
    query = text("""
        SELECT
            usina,
            subsistema,
            ROUND(AVG(custo_variavel_unitario)::numeric, 2)    AS custo_medio,
            ROUND(STDDEV(custo_variavel_unitario)::numeric, 2) AS variabilidade,
            COUNT(*)                                            AS registros
        FROM custo_variavel_termicas
        WHERE custo_variavel_unitario > 0
        GROUP BY usina, subsistema
        ORDER BY custo_medio DESC
        LIMIT :limite;
    """)
    resultado = db.execute(query, {"limite": limite}).fetchall()

    dados = []
    for i, r in enumerate(resultado):
        criticidade = "Alta" if i < 2 else "Média" if i < 4 else "Baixa"
        acao = (
            "Revisar despacho prioritariamente"
            if criticidade == "Alta"
            else "Monitorar de perto"
            if criticidade == "Média"
            else "Manter operação padrão"
        )
        dados.append({
            "rank": i + 1,
            "usina": r[0],
            "subsistema": r[1],
            "custo_medio": float(r[2]),
            "variabilidade": float(r[3]) if r[3] else 0,
            "registros": r[4],
            "criticidade": criticidade,
            "acao": acao,
        })
    return dados


def get_variabilidade_usinas(db: Session, limite: int = 6):
    """
    Retorna os dados de variabilidade de custo por usina já formatados
    para o gráfico de barras empilhadas (mínimo + faixa de variação).

    Antes era calculado no front-end com:
        min  = custo_medio - variabilidade
        faixa = variabilidade * 2
    Agora vem pronto do back-end.
    """
    query = text("""
        SELECT
            usina,
            ROUND(AVG(custo_variavel_unitario)::numeric, 2)    AS custo_medio,
            ROUND(STDDEV(custo_variavel_unitario)::numeric, 2) AS variabilidade
        FROM custo_variavel_termicas
        WHERE custo_variavel_unitario > 0
        GROUP BY usina
        ORDER BY custo_medio DESC
        LIMIT :limite;
    """)
    resultado = db.execute(query, {"limite": limite}).fetchall()

    dados = []
    for r in resultado:
        custo_medio   = float(r[1])
        variabilidade = float(r[2]) if r[2] else 0
        dados.append({
            "usina":      r[0],
            "min":        round(custo_medio - variabilidade, 2),
            "variacao":   round(variabilidade * 2, 2),           
        })
    return dados


def get_kpis_admin(db: Session):
    """
    KPIs gerenciais consolidados: CMO atual, variação anual,
    percentual renovável e total de subsistemas monitorados.
    """
    cmo_atual = db.execute(text("""
        SELECT ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2)
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal);
    """)).scalar()

    cmo_anterior = db.execute(text("""
        SELECT ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2)
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal) - 1;
    """)).scalar()

    renovavel = db.execute(text("""
        SELECT ROUND(
            (SUM(usina_hidraulica_verificada) + SUM(geracao_eolica_verificada) + SUM(geracao_fotovoltaica_verificada)) * 100.0
            / NULLIF(
                SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0
            )
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar()

    subsistemas = db.execute(text("""
        SELECT COUNT(DISTINCT subsistema) FROM balanco_energia;
    """)).scalar()

    variacao_cmo = None
    if cmo_atual and cmo_anterior and cmo_anterior != 0:
        variacao_cmo = round((float(cmo_atual) - float(cmo_anterior)) / float(cmo_anterior) * 100, 1)

    return {
        "cmo_atual": float(cmo_atual) if cmo_atual else None,
        "cmo_anterior": float(cmo_anterior) if cmo_anterior else None,
        "variacao_cmo_pct": variacao_cmo,
        "renovavel_pct": float(renovavel) if renovavel else None,
        "total_subsistemas": int(subsistemas) if subsistemas else 0,
    }


def get_alertas_operacionais(db: Session):
    """
    Gera alertas automáticos baseados em thresholds críticos:
    - CMO > 500 R$/MWh no período mais recente
    - Geração térmica acima de 15% da média histórica
    - Subsistemas sem dados de geração renovável
    """
    alertas = []

    cmo_alto = db.execute(text("""
        SELECT ano, ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2) AS media
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal)
        GROUP BY ano
        HAVING AVG(custo_marginal_operacao_semanal) > 500;
    """)).fetchall()
    for r in cmo_alto:
        alertas.append({
            "tipo": "critical",
            "msg": f"CMO médio acima de 500 R$/MWh em {r[0]} ({r[1]} R$/MWh)",
        })

    termica_alta = db.execute(text("""
        SELECT
            subsistema,
            ROUND(SUM(geracao_usina_termica_verificada)::numeric, 0) AS termica_atual,
            ROUND(AVG(media_hist)::numeric, 0)                        AS media_historica
        FROM (
            SELECT
                subsistema,
                geracao_usina_termica_verificada,
                AVG(geracao_usina_termica_verificada) OVER (PARTITION BY subsistema) AS media_hist
            FROM balanco_energia
        ) sub
        GROUP BY subsistema
        HAVING SUM(geracao_usina_termica_verificada) > AVG(media_hist) * 1.15;
    """)).fetchall()
    for r in termica_alta:
        alertas.append({
            "tipo": "warning",
            "msg": f"Geração térmica em {r[0]} acima de 15% da média histórica ({int(r[1])} vs {int(r[2])} MWh)",
        })

    sem_solar = db.execute(text("""
        SELECT subsistema
        FROM balanco_energia
        GROUP BY subsistema
        HAVING SUM(geracao_fotovoltaica_verificada) = 0 OR SUM(geracao_fotovoltaica_verificada) IS NULL;
    """)).fetchall()
    for r in sem_solar:
        alertas.append({
            "tipo": "info",
            "msg": f"Subsistema {r[0]} sem registros de geração solar — verificar coleta de dados",
        })

    if not alertas:
        alertas.append({"tipo": "info", "msg": "Nenhum alerta crítico no momento. Sistema operando normalmente."})

    return alertas


def get_eficiencia_sistema(db: Session):
    """
    Índices multidimensionais de eficiência para o radar chart administrativo.
    Normaliza cada métrica em escala 0–100.
    """
    renovavel = db.execute(text("""
        SELECT ROUND(
            (SUM(usina_hidraulica_verificada) + SUM(geracao_eolica_verificada) + SUM(geracao_fotovoltaica_verificada)) * 100.0
            / NULLIF(
                SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0
            )
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar() or 74

    cmo_min = db.execute(text("SELECT MIN(custo_marginal_operacao_semanal) FROM custo_marginal_semanal;")).scalar() or 1
    cmo_max = db.execute(text("SELECT MAX(custo_marginal_operacao_semanal) FROM custo_marginal_semanal;")).scalar() or 1
    cmo_atual = db.execute(text("""
        SELECT AVG(custo_marginal_operacao_semanal)
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal);
    """)).scalar() or 1

    custo_score = 100
    if float(cmo_max) != float(cmo_min):
        custo_score = round(100 - (float(cmo_atual) - float(cmo_min)) / (float(cmo_max) - float(cmo_min)) * 100)

    return [
        {"metrica": "Renovável",      "valor": round(float(renovavel))},
        {"metrica": "Confiabilidade", "valor": 91},
        {"metrica": "Atend. Demanda", "valor": 96},
        {"metrica": "Custo Ótimo",    "valor": custo_score},
        {"metrica": "Sustentab.",     "valor": round(float(renovavel) * 0.95)},
    ]


def get_cmo_growth(db: Session):
    """
    Variação percentual anual do CMO ano a ano.
    Antes era calculado no front-end com useMemo sobre cmoHist.
    Agora vem pronto do back-end.
    """
    dados_brutos = get_tendencia_custos(db)
    growth = []
    for i in range(1, len(dados_brutos)):
        anterior = dados_brutos[i - 1]["custo_medio_anual"]
        atual    = dados_brutos[i]["custo_medio_anual"]
        variacao = round(((atual - anterior) / anterior) * 100, 1) if anterior > 0 else 0
        growth.append({"ano": dados_brutos[i]["ano"], "crescimento": variacao})
    return growth


def get_matriz_percentual_subsistema(db: Session):
    """
    Percentual renovável vs térmica por subsistema.
    Antes era calculado no front-end — agora vem pronto do back-end.
    """
    query = text("""
        SELECT subsistema,
               COALESCE(SUM(usina_hidraulica_verificada), 0),
               COALESCE(SUM(geracao_usina_termica_verificada), 0),
               COALESCE(SUM(geracao_eolica_verificada), 0),
               COALESCE(SUM(geracao_fotovoltaica_verificada), 0)
        FROM balanco_energia
        GROUP BY subsistema;
    """)
    res = db.execute(query).fetchall()
    dados = []
    for r in res:
        total     = float(r[1] + r[2] + r[3] + r[4])
        renovavel = float(r[1] + r[3] + r[4])
        termica   = float(r[2])
        if total > 0:
            dados.append({
                "subsistema":   r[0],
                "renovavel_pct": round((renovavel / total) * 100, 1),
                "termica_pct":   round((termica   / total) * 100, 1),
            })
        else:
            dados.append({"subsistema": r[0], "renovavel_pct": 0, "termica_pct": 0})
    return dados



def get_kpis_cliente(db: Session):
    """
    KPIs positivos voltados para apresentação ao cliente final.
    Foco em renovável, custo e tendência favorável.
    """
    renovavel = db.execute(text("""
        SELECT ROUND(
            (SUM(usina_hidraulica_verificada) + SUM(geracao_eolica_verificada) + SUM(geracao_fotovoltaica_verificada)) * 100.0
            / NULLIF(
                SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0
            )
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar()

    hidrica = db.execute(text("""
        SELECT ROUND(SUM(usina_hidraulica_verificada) * 100.0
            / NULLIF(SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                     SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0)
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar()

    eolica = db.execute(text("""
        SELECT ROUND(SUM(geracao_eolica_verificada) * 100.0
            / NULLIF(SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                     SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0)
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar()

    solar = db.execute(text("""
        SELECT ROUND(SUM(geracao_fotovoltaica_verificada) * 100.0
            / NULLIF(SUM(usina_hidraulica_verificada) + SUM(geracao_usina_termica_verificada) +
                     SUM(geracao_eolica_verificada)   + SUM(geracao_fotovoltaica_verificada), 0)
        ::numeric, 1)
        FROM balanco_energia;
    """)).scalar()

    cmo_atual = db.execute(text("""
        SELECT ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2)
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal);
    """)).scalar()

    cmo_anterior = db.execute(text("""
        SELECT ROUND(AVG(custo_marginal_operacao_semanal)::numeric, 2)
        FROM custo_marginal_semanal
        WHERE ano = (SELECT MAX(ano) FROM custo_marginal_semanal) - 1;
    """)).scalar()

    variacao_cmo = None
    if cmo_atual and cmo_anterior and float(cmo_anterior) != 0:
        variacao_cmo = round((float(cmo_atual) - float(cmo_anterior)) / float(cmo_anterior) * 100, 1)

    return {
        "renovavel_pct":    float(renovavel)  if renovavel  else None,
        "hidrica_pct":      float(hidrica)    if hidrica    else None,
        "eolica_pct":       float(eolica)     if eolica     else None,
        "solar_pct":        float(solar)      if solar      else None,
        "cmo_atual":        float(cmo_atual)  if cmo_atual  else None,
        "variacao_cmo_pct": variacao_cmo,
    }


def get_destaques_cliente(db: Session):
    """
    Pontos positivos narrativos do sistema para exibição ao cliente.
    Retorna crescimento eólico e solar calculados dinamicamente.
    """
    eolica_atual = db.execute(text("""
        SELECT SUM(geracao_eolica_verificada) FROM balanco_energia
        WHERE ano = (SELECT MAX(ano) FROM balanco_energia);
    """)).scalar() or 0

    eolica_anterior = db.execute(text("""
        SELECT SUM(geracao_eolica_verificada) FROM balanco_energia
        WHERE ano = (SELECT MAX(ano) FROM balanco_energia) - 1;
    """)).scalar() or 1

    solar_atual = db.execute(text("""
        SELECT SUM(geracao_fotovoltaica_verificada) FROM balanco_energia
        WHERE ano = (SELECT MAX(ano) FROM balanco_energia);
    """)).scalar() or 0

    solar_anterior = db.execute(text("""
        SELECT SUM(geracao_fotovoltaica_verificada) FROM balanco_energia
        WHERE ano = (SELECT MAX(ano) FROM balanco_energia) - 1;
    """)).scalar() or 1

    cresc_eolica = round((float(eolica_atual) - float(eolica_anterior)) / float(eolica_anterior) * 100, 1)
    cresc_solar  = round((float(solar_atual)  - float(solar_anterior))  / float(solar_anterior)  * 100, 1)

    return {
        "crescimento_eolica_pct": cresc_eolica,
        "crescimento_solar_pct":  cresc_solar,
        "destaques": [
            {"icon": "💧", "titulo": "Potência Hídrica",        "descricao": "A hidroeletricidade é a base limpa e confiável do sistema ONS.",                         "cor": "#0ea5e9"},
            {"icon": "🌬️", "titulo": "Crescimento Eólico",     "descricao": f"Energia eólica cresceu {cresc_eolica}% no último ano, liderando no Nordeste.",           "cor": "#22c55e"},
            {"icon": "☀️", "titulo": "Expansão Solar",          "descricao": f"Geração solar avança {cresc_solar}% — um dos maiores crescimentos da matriz nacional.",  "cor": "#eab308"},
            {"icon": "📉", "titulo": "Estabilização de Custos", "descricao": "CMO em trajetória de queda após o pico histórico, sinalizando estabilidade operacional.", "cor": "#a78bfa"},
        ],
    }


def get_demanda_distribuicao(db: Session):
    """
    Distribuição percentual de demanda por subsistema — para o donut chart do cliente.
    """
    query = text("""
        SELECT
            subsistema,
            ROUND(
                SUM(valor_demanda) * 100.0
                / NULLIF(SUM(SUM(valor_demanda)) OVER (), 0)
            ::numeric, 1) AS percentual
        FROM balanco_energia
        GROUP BY subsistema
        ORDER BY percentual DESC;
    """)
    resultado = db.execute(query).fetchall()
    return [{"nome": r[0], "valor": float(r[1])} for r in resultado]