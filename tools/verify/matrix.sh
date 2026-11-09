#!/bin/bash
# Compare every case at one width: tools/verify/matrix.sh 1440 [pages...]
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/../.." || exit 1
W=${1:-1440}; shift
PAGES=${@:-eazychange-ru eazychange-en autotor-ru autotor-en pot-ru pot-en ostral-ru ostral-en vv-ru vv-en mikulich-ru mikulich-en}
node tools/verify/snap.mjs "$W" $PAGES >/dev/null 2>&1
for p in $PAGES; do
  node tools/verify/diff.mjs tools/verify/.snap/orig-$p-$W.json tools/verify/.snap/copy-$p-$W.json
done
