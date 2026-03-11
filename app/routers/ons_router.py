from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import ons_service

router = APIRouter()

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