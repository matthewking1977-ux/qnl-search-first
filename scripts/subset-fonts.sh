#!/usr/bin/env bash
# Re-subsets the Arabic web fonts to Modern Standard Arabic + punctuation
# (drops Persian/Urdu/extended blocks the site never uses: ~70% smaller).
# Requires: pip install fonttools brotli
set -euo pipefail
U="U+0020-007E,U+00A0,U+00AB,U+00BB,U+00D7,U+0600-061F,U+0621-065F,U+0660-066D,U+0670-0671,U+06CC,U+06D4,U+200C-200F,U+2010-2014,U+2018-201D,U+2026,U+FD3E-FD3F"
for f in noto-sans-arabic-arabic-400-normal noto-sans-arabic-arabic-500-normal noto-naskh-arabic-arabic-400-normal noto-naskh-arabic-arabic-500-normal; do
  src=$(ls node_modules/@fontsource/*/files/$f.woff2)
  pyftsubset "$src" --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file="public/fonts/$f.woff2"
done
# Micro-font for the «العربية» language switch on English pages
pyftsubset node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-500-normal.woff2 \
  --text="العربية" --layout-features='*' --flavor=woff2 --output-file=public/fonts/qnl-ar-label-500.woff2
ls -la public/fonts
