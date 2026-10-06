#!/bin/bash
# Двойной клик — запустить Storybook с компонентами сайта.
# Остановить: Ctrl+C или закрыть это окно Терминала.

cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Не найден Node.js (ожидался в ~/.local/node/bin)."
  read -r -p "Нажмите Enter, чтобы закрыть."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 Первый запуск — ставлю зависимости..."
  npm install || { echo "❌ Установка не удалась."; read -r -p "Нажмите Enter, чтобы закрыть."; exit 1; }
fi

PORT=6430
echo "🚀 Storybook: http://localhost:$PORT"
echo

( sleep 6; open "http://localhost:$PORT" ) &
npx storybook dev -p "$PORT" --no-open
