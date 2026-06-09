#!/usr/bin/env bash
set -e

FRONT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$FRONT_DIR"

# Cria .env se não existir
if [ ! -f .env ]; then
  echo "⚠  .env não encontrado — copiando .env.example"
  cp .env.example .env
fi

# Instala dependências se node_modules não existir
if [ ! -d node_modules ]; then
  echo "📦  Instalando dependências..."
  npm install
fi

echo ""
echo "🚀  Buildando e servindo frontend (Vite preview)..."
echo "    URL padrão: http://localhost:4173"
echo ""
npm start
