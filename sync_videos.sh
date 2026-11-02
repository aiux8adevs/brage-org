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
R=~/projects/manim-studio/media/brage-org/radiografi   # one folder per topic: videos, masters, PDFs

# page folder | topic folder:scene class:file name, one or more | poster names per part?
live=(
  "learn/radiography/detector|1a-fra-foton-til-tal:Detektor:detektor|"
  "learn/radiography/histogram|1b-fra-tal-til-billede:Histogram:histogram|"
  "learn/radiography/scatter|3a-spredt-straaling:SpredtStraaling:spredt,3b-rasteret:Raster3b:raster3b|parts"
)
drafts=(
  "learn/radiography/shadow|4-skarphed:Uskarphed:uskarphed|"
  "learn/radiography/scatter|3a-spredt-straaling:SpredtStraaling:spredt,3b-rasteret:Raster3b:raster3b,3c-andre-veje:Tage3c:tage3c|parts"
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
        cp "$R/$src/${cls}_${lang}_${lvl}.mp4" "$out/${name}_${lang}_${lvl}.mp4"
      done
      # poster: the title card, 2.6 s in; one per part when the page has several
      poster="$out/poster_$lang.jpg"; [[ "$mode" == "parts" ]] && poster="$out/poster_${name}_$lang.jpg"
      ffmpeg -v error -y -ss 2.6 -i "$R/$src/${cls}_${lang}_grund.mp4" -frames:v 1 \
        -vf scale=1280:-1 -q:v 4 "$poster"
      # the glossary and transcript PDF, made by make_transcript_radiografi.py
      cp "$R/$src/${name}_${lang}.pdf" "$out/"
    done
    # the English podcast episode, where there is one
    if [[ -f "$R/$src/podcast_en.mp3" ]]; then cp "$R/$src/podcast_en.mp3" "$out/podcast_${name}_en.mp3"; fi
  done
  echo "synced $page"
done
