from fastapi import FastAPI
from app.routers import ons_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API ONS - Igeos (Desafio)",
    description="API organizada em camadas para gestão de energia.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ons_router.router)

@app.get("/")
def read_root():
    return {"mensagem": "API da ONS operante! Acesse /docs para ver os endpoints."}