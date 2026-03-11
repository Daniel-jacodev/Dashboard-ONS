from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import ons_service

router = APIRouter()


# ─── ROTAS EXISTENTES (mantidas sem alteração) ──────────────────────────────

@router.get("/api/custos/termicas-mais-caras")
def obter_usinas_mais_caras(limite: int = 10, db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_usinas_mais_caras(db, limite)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/dashboard/matriz-energetica")
def obter_matriz_energetica_geral(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_matriz_energetica(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/operacao/historico-demanda/{ano}/{mes}")
def historico_demanda_mensal(ano: int, mes: int, db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_historico_demanda(db, ano, mes)
        if not dados:
            return {"status": "vazio", "mensagem": "Nenhum dado encontrado."}
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/insights/tendencia-custo-marginal")
def insight_tendencia_custos(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_tendencia_custos(db)
        return {"status": "sucesso", "insight": "Evolução do custo marginal da ONS", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── NOVAS ROTAS — VISÃO ADMINISTRATIVA ─────────────────────────────────────

@router.get("/api/admin/kpis")
def obter_kpis_admin(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_kpis_admin(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/custo-real-vs-previsto")
def obter_custo_real_vs_previsto(ano: int = Query(default=2024), db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_custo_real_vs_previsto(db, ano)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/ranking-usinas")
def obter_ranking_usinas_admin(limite: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_ranking_usinas_admin(db, limite)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/alertas")
def obter_alertas_operacionais(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_alertas_operacionais(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/eficiencia-sistema")
def obter_eficiencia_sistema(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_eficiencia_sistema(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── NOVAS ROTAS — VISÃO CLIENTE ────────────────────────────────────────────

@router.get("/api/client/kpis")
def obter_kpis_cliente(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_kpis_cliente(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/client/destaques")
def obter_destaques_cliente(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_destaques_cliente(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/client/demanda-distribuicao")
def obter_demanda_distribuicao(db: Session = Depends(get_db)):
    try:
        dados = ons_service.get_demanda_distribuicao(db)
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))