#!/usr/bin/env bash
# Copy the rendered teaching videos from manim-studio into site/ (they are not kept in git).
# The videos are rebuilt from code in ~/projects/manim-studio: scenes/radiografi/<topic>_da.py,
# narration with Kokoro af_heart (English) and Røst + the synthetic f07 voice (Danish).
# Run this after a re-render, then ./deploy.sh --go.
set -euo pipefail
cd "$(dirname "$0")"
MS=~/projects/manim-studio/media/videos

# site page folder | manim output folder | scene class
pages=(
  "learn/radiography/histogram|histogram_da|Histogram"
  "learn/radiography/detector|detektor_da|Detektor"
)
for p in "${pages[@]}"; do
  IFS="|" read -r page src cls <<< "$p"
  out="site/$page/video"; mkdir -p "$out"
  for lang in da en; do
    for lvl in grund fordybelse; do
      cp "$MS/$src/1080p60/send/${cls}_${lang}_${lvl}.mp4" "$out/$(echo "$cls" | tr A-Z a-z)_${lang}_${lvl}.mp4"
    done
    # poster: the title card, 2.6 s in
    ffmpeg -v error -y -ss 2.6 -i "$MS/$src/1080p60/send/${cls}_${lang}_grund.mp4" -frames:v 1 \
      -vf scale=1280:-1 -q:v 4 "$out/poster_$lang.jpg"
  done
  # the glossary and transcript PDFs, made by make_transcript_radiografi.py
  pdf=$(echo "$src" | sed 's/_da$//')
  for lang in da en; do cp ~/projects/manim-studio/media/handouts/${pdf}_${lang}.pdf "$out/"; done
  echo "synced $page"
done
