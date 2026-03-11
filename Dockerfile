FROM python:3.10-slim

WORKDIR /app_code

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante dos arquivos
COPY . .