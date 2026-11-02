#!/usr/bin/env bash
# Copy the rendered teaching videos, posters and PDFs from manim-studio into site/ (they are not kept in git).
# The videos are rebuilt from code in ~/projects/manim-studio: scenes/radiografi/<scene>_da.py,
# narration with Kokoro af_heart (English) and Røst + the synthetic f07 voice (Danish).
# Run this after a re-render, then ./deploy.sh --go.
#
#   ./sync_videos.sh            the pages that are live
#   ./sync_videos.sh --drafts   also the pages still waiting for the owner's approval
set -euo pipefail
cd "$(dirname "$0")"
MS=~/projects/manim-studio/media
HO=$MS/handouts

# page folder | manim output folder:scene class:file name, one or more | poster names per part?
live=(
  "learn/radiography/detector|detektor_da:Detektor:detektor|"
  "learn/radiography/histogram|histogram_da:Histogram:histogram|"
)
drafts=(
  "learn/radiography/shadow|uskarphed_da:Uskarphed:uskarphed|"
  "learn/radiography/scatter|spredt_da:SpredtStraaling:spredt,raster3b_da:Raster3b:raster3b,tage3c_da:Tage3c:tage3c|parts"
)
pages=("${live[@]}")
[[ "${1:-}" == "--drafts" ]] && pages+=("${drafts[@]}")

for p in "${pages[@]}"; do
  IFS="|" read -r page sources mode <<< "$p"
  out="site/$page/video"; mkdir -p "$out"
  IFS="," read -ra parts <<< "$sources"
  for part in "${parts[@]}"; do
    IFS=":" read -r src cls name <<< "$part"
    for lang in da en; do
      for lvl in grund fordybelse; do
        cp "$MS/videos/$src/1080p60/send/${cls}_${lang}_${lvl}.mp4" "$out/${name}_${lang}_${lvl}.mp4"
      done
      # poster: the title card, 2.6 s in; one per part when the page has several
      poster="$out/poster_$lang.jpg"; [[ "$mode" == "parts" ]] && poster="$out/poster_${name}_$lang.jpg"
      ffmpeg -v error -y -ss 2.6 -i "$MS/videos/$src/1080p60/send/${cls}_${lang}_grund.mp4" -frames:v 1 \
        -vf scale=1280:-1 -q:v 4 "$poster"
      # the glossary and transcript PDF, made by make_transcript_radiografi.py
      cp "$HO/${name}_${lang}.pdf" "$out/"
    done
  done
  echo "synced $page"
done
