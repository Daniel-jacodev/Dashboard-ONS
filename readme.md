# ⚡ Sistema de Inteligência ONS - Dashboard Igeos

Este projeto é um Dashboard de Inteligência de Dados desenvolvido para monitoramento e análise de custos operacionais, demanda e matriz energética do Operador Nacional do Sistema Elétrico (ONS).

## 🚀 Tecnologias Utilizadas

- **Frontend:** React.js, Vite, Recharts (Gráficos Interativos).
- **Backend:** Python, FastAPI, Uvicorn.
- **Banco de Dados:** PostgreSQL 15.
- **Infraestrutura:** Docker & Docker Compose.

## 📊 Funcionalidades do Dashboard

O sistema apresenta 4 visualizações críticas para análise de dados energéticos:

1.  **Top Usinas (Custo Operacional):** Gráfico de barras horizontais que identifica as usinas térmicas com maior custo de geração (R$/MWh), permitindo ajustes dinâmicos via filtro.
2.  **Tendência de Custo Marginal:** Gráfico de área que mostra a evolução histórica das médias anuais de custo, facilitando a identificação de períodos de crise ou estabilidade.
3.  **Matriz Energética por Subsistema:** Gráfico de colunas empilhadas comparando a composição da geração (Hídrica, Térmica, Eólica e Solar) entre as diferentes regiões do país.
4.  **Distribuição de Demanda:** Gráfico de rosca (Donut) que exibe a participação percentual de cada subsistema no consumo total de energia.

## 🛠️ Como Executar

Certifique-se de ter o **Docker** e o **Docker Compose** instalados em sua máquina.

1.  Clone este repositório.
2.  Abra o terminal na pasta raiz do projeto.
3.  Execute o comando:
    ```bash
    sudo docker compose up -d --build
    ```
4.  Aguarde a finalização da carga de dados na API.
5.  Acesse no navegador: `http://localhost:3000`

## ⚙️ Arquitetura de Containers

- `igeos_frontend`: Servidor de desenvolvimento Vite rodando na porta 3000.
- `igeos_api`: API Python rodando na porta 8000 com carregamento automático de dados via CSV.
- `igeos_postgres`: Banco de dados persistente rodando na porta 5433 (para evitar conflitos com instâncias locais).

---
