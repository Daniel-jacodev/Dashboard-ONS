import pandas as pd
import os
import time
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://admin:adminpassword@db:5432/ons_data"

def load_csv_on_db():
    print("Aguardando o banco de dados iniciar")
    engine = create_engine(DATABASE_URL)
    
    arquivos = {
        "balanco_energia": "data/balanco_energia.csv",
        "custo_marginal_semanal": "data/custo_marginal_semanal.csv",
        "custo_marginal_semi_horario": "data/custo_marginal_semi_horario.csv",
        "custo_variavel_termicas": "data/custo_variavel_termicas.csv"
    }

    for tabela, caminho_arquivo in arquivos.items():
        if os.path.exists(caminho_arquivo):
            for chunk in pd.read_csv(caminho_arquivo, chunksize=1000):
                chunk.to_sql(tabela, engine, if_exists='append', index=False)
        else:
            print(f"Arquivo {caminho_arquivo} não encontrado.")
            
if __name__ == "__main__":
    while True:
        try:
            load_csv_on_db()
            print("Dados carregados com sucesso!")
            break
        except Exception as e:
            print(f"Erro ao carregar dados: {e}")
            print("Tentando novamente em 5 segundos...")
            time.sleep(5)