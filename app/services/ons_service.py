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