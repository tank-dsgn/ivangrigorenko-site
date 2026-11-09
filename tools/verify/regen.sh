#!/bin/bash
# Regenerate the cases, build, and serve the copy on localhost:3000.
#   tools/verify/regen.sh            — every page
#   PAGES="pot vv" tools/verify/regen.sh
#   PAGES=none tools/verify/regen.sh — rebuild only, without generating
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/../.." || exit 1
[ "$PAGES" = none ] && PAGES=" "
for p in ${PAGES:-eazychange autotor pot ostral vv mikulich about}; do
  for l in ru en; do
    [ "$p" = home ] && continue
    node tools/figma/generate.mjs "$p-$l" --sections >/dev/null || echo "FAIL $p-$l"
  done
done
# home: the Russian one is /home-ru, the English one sits at the site root (index in the export)
if [ -z "$PAGES" ] || [[ "$PAGES" == *home* ]]; then
  node tools/figma/generate.mjs home-ru --sections >/dev/null || echo "FAIL home-ru"
  node tools/figma/generate.mjs index --sections --out components/generated/home-en >/dev/null || echo "FAIL home-en"
fi
(lsof -ti:3000 | xargs kill -9 2>/dev/null; true)
rm -rf .next
npm run build 2>&1 | grep -E "rror|✓ Compiled|Failed" | head -10
# the build failed, so the server will not come up and there is no point waiting
[ -f .next/BUILD_ID ] || { npm run build 2>&1 | grep -E "error TS|rror:" | head -10; echo "BUILD FAILED"; exit 1; }
(node node_modules/next/dist/bin/next start --port 3000 >/tmp/next.log 2>&1 &)
until curl -s -o /dev/null http://localhost:3000/pot-ru; do :; done
echo up
