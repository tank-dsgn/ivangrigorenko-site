#!/bin/bash
# Double-click to start Storybook with the site's components.
# To stop: Ctrl+C, or close this Terminal window.

cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js not found (expected in ~/.local/node/bin)."
  read -r -p "Press Enter to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 First run — installing dependencies..."
  npm install || { echo "❌ Install failed."; read -r -p "Press Enter to close."; exit 1; }
fi

PORT=6430
echo "🚀 Storybook: http://localhost:$PORT"
echo

( sleep 6; open "http://localhost:$PORT" ) &
npx storybook dev -p "$PORT" --no-open
