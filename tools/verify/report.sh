#!/bin/bash
# Расхождения по уже снятым страницам, без шапки (она собрана вручную и отличается разметкой):
#   tools/verify/report.sh 1440 pot-ru vv-ru
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/../.." || exit 1
W=$1; shift
for p in "$@"; do
  echo "### $p"
  node tools/verify/diff.mjs tools/verify/.snap/orig-$p-$W.json tools/verify/.snap/copy-$p-$W.json 800 | awk 'NR>1' \
    | grep -v 'TXT \(Проекты\|Обо мне\|Контакты\|EN\|/\|RU\|Work\|About\|Contacts\) ориг' | cut -c1-${COLS:-190} | head -${MAX:-25}
done
