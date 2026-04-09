-- Executar no PostgreSQL do Checkup360 ANTES de subir o Flowise
-- docker exec -i postgres psql -U postgres < init-db.sql

-- Criar database separado para Flowise
CREATE DATABASE flowise;

-- Conectar ao database flowise
\c flowise

-- Habilitar pgvector para RAG (vector store)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
