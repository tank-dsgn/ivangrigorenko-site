#!/bin/bash
# Перегенерировать кейсы, собрать и поднять копию на localhost:3000.
#   tools/verify/regen.sh            — все страницы
#   PAGES="pot vv" tools/verify/regen.sh
#   PAGES=none tools/verify/regen.sh — только пересобрать, без генерации
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/../.." || exit 1
[ "$PAGES" = none ] && PAGES=" "
for p in ${PAGES:-eazychange autotor pot ostral vv mikulich about}; do
  for l in ru en; do
    node tools/figma/generate.mjs "$p-$l" --sections >/dev/null || echo "FAIL $p-$l"
  done
done
# главная: русская — /home-ru, английская лежит в корне сайта (выгрузка index)
if [ -z "$PAGES" ] || [[ "$PAGES" == *home* ]]; then
  node tools/figma/generate.mjs home-ru --sections >/dev/null || echo "FAIL home-ru"
  node tools/figma/generate.mjs index --sections --out components/generated/home-en >/dev/null || echo "FAIL home-en"
fi
(lsof -ti:3000 | xargs kill -9 2>/dev/null; true)
rm -rf .next
npm run build 2>&1 | grep -E "rror|✓ Compiled|Failed" | head -10
(node node_modules/next/dist/bin/next start --port 3000 >/tmp/next.log 2>&1 &)
until curl -s -o /dev/null http://localhost:3000/pot-ru; do :; done
echo up
