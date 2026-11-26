#!/usr/bin/env bash
# Hero video + poster from the supplied source (assets/video/qnl-hero-v3-exterior-source.mp4:
# the exterior film supplied 26 Nov 2026, trimmed to 1.0–39.0 s to drop its fade in/out).
# Grade (26 Nov 2026, client: "showcase the building"): no blur and no darkening, only a
# touch less saturation so the maroon accent stays the warmest note. Legibility of the
# headline comes from a light, local scrim in Hero.astro instead. The poster is the first
# frame with the same grade, so the poster → video hand-off is seamless. Then run `npm run media`.
set -euo pipefail
V=assets/video/qnl-hero-v3-exterior-source.mp4
T="-ss 0 -to 38.0"
G="eq=saturation=0.92"
mkdir -p public/video
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libx264 -preset slow -crf 33 -profile:v high -pix_fmt yuv420p -vf "scale=960:-2,$G" -movflags +faststart -g 60 public/video/hero-960.mp4
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libx264 -preset slow -crf 34 -profile:v main -pix_fmt yuv420p -vf "scale=640:-2,$G" -movflags +faststart -g 60 public/video/hero-640.mp4
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libvpx-vp9 -b:v 0 -crf 49 -row-mt 1 -deadline good -cpu-used 4 -vf "scale=960:-2,$G" public/video/hero-960.webm
# Poster at 1280 wide, same grade
ffmpeg -v error -y -ss 0 -i $V -map 0:v:0 -frames:v 1 -vf "scale=1280:-2,$G" assets/video/hero-poster.png
ls -la public/video assets/video/hero-poster.png
