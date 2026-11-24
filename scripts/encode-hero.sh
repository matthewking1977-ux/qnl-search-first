#!/usr/bin/env bash
# Hero video + poster from the supplied source (assets/video/qnl-hero-v2-source.mp4).
# Grade: softened (slight blur), desaturated and darkened so the footage sits back
# behind the headline and search bar. The poster is the first frame with the same
# grade, so the poster → video hand-off is seamless. Then run `npm run media`.
set -euo pipefail
V=assets/video/qnl-hero-v2-source.mp4
T="-ss 1.2 -to 35.0"
G="gblur=sigma=2.2,eq=saturation=0.72:contrast=0.92,lutyuv=y=val*0.82+12"
mkdir -p public/video
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libx264 -preset slow -crf 30 -profile:v high -pix_fmt yuv420p -vf "scale=960:-2,$G" -movflags +faststart -g 60 public/video/hero-960.mp4
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libx264 -preset slow -crf 31 -profile:v main -pix_fmt yuv420p -vf "scale=640:-2,$G" -movflags +faststart -g 60 public/video/hero-640.mp4
ffmpeg -v error -y $T -i $V -map 0:v:0 -an -c:v libvpx-vp9 -b:v 0 -crf 44 -row-mt 1 -deadline good -cpu-used 4 -vf "scale=960:-2,$G" public/video/hero-960.webm
# Poster at 1280 wide (blur scaled to match the 960 encode's look)
ffmpeg -v error -y -ss 1.2 -i $V -map 0:v:0 -frames:v 1 -vf "scale=1280:-2,gblur=sigma=2.9,eq=saturation=0.72:contrast=0.92,lutyuv=y=val*0.82+12" assets/video/hero-poster.png
ls -la public/video assets/video/hero-poster.png
