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

# page folder | topic folder:scene class:file name[:podcast], one or more | poster names per part?
# ":podcast" marks an approved English podcast; without it the episode is not copied.
live=(
  "learn/radiography/detector|1a-fra-foton-til-tal:Detektor:detektor:podcast|"
  "learn/radiography/histogram|1b-fra-tal-til-billede:Histogram:histogram:podcast|"
  "learn/radiography/scatter|3a-spredt-straaling:SpredtStraaling:spredt:podcast,3b-rasteret:Raster3b:raster3b|parts"
  "learn/radiography/noise|2-stoej:Stoej:stoej:podcast|"
  "learn/radiography/shadow|4-skarphed:Uskarphed:uskarphed:podcast|"
)
drafts=(
  "learn/radiography/scatter|3a-spredt-straaling:SpredtStraaling:spredt:podcast,3b-rasteret:Raster3b:raster3b:podcast,3c-andre-veje:Tage3c:tage3c:podcast|parts"
  "learn/radiography/tube|5a-roentgenroeret:Roer5a:roer5a,5b-automatisk-eksponering:Aec5b:aec5b|parts"
)
pages=("${live[@]}")
[[ "${1:-}" == "--drafts" ]] && pages+=("${drafts[@]}")

for p in "${pages[@]}"; do
  IFS="|" read -r page sources mode <<< "$p"
  out="site/$page/video"; mkdir -p "$out"
  IFS="," read -ra parts <<< "$sources"
  for part in "${parts[@]}"; do
    IFS=":" read -r src cls name pod <<< "$part"
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
    # where each narrated line starts in each version, for the self-test's "watch the video from here" links
    ~/code/personal/venv/bin/python ~/projects/manim-studio/line_times_page.py "$R/$src" "$cls" "$name" "$out/times_${name}.json"
    # the English podcast episode, only when marked approved (":podcast")
    if [[ "$pod" == "podcast" && -f "$R/$src/podcast_en.mp3" ]]; then cp "$R/$src/podcast_en.mp3" "$out/podcast_${name}_en.mp3"; fi
  done
  echo "synced $page"
done

# Ultrasound: staged behind the password (staged.list), so synced every time.
# Page folder | topic folder:scene class:file name:voice part (the narration module, e.g. knapper_da / knapper_en)
U=~/projects/manim-studio/media/brage-org/ultralyd
ultra=(
  "learn/ultrasound/echo|u1-ekko:Echo:echo:echo"
  "learn/ultrasound/tissue|u2-vaev:Tissue:tissue:tissue"
  "learn/ultrasound/probe|u3-proben:Probe:probe:probe"
  "learn/ultrasound/knobs|u4-knapper:Knapper:knapper:knapper"
  "learn/ultrasound/artefacts|u5-artefakter:Artefakter:artefakter:artefakter"
  "learn/ultrasound/doppler|u6-doppler:Doppler:doppler:doppler"
)
for p in "${ultra[@]}"; do
  IFS="|" read -r page part <<< "$p"
  IFS=":" read -r src cls name voice <<< "$part"
  out="site/$page/video"; mkdir -p "$out"
  for lang in da en; do
    for lvl in grund fordybelse; do cp "$U/$src/${cls}_${lang}_${lvl}.mp4" "$out/${name}_${lang}_${lvl}.mp4"; done
    ffmpeg -v error -y -ss 2.6 -i "$U/$src/${cls}_${lang}_grund.mp4" -frames:v 1 -vf scale=1280:-1 -q:v 4 "$out/poster_$lang.jpg"
    cp "$U/$src/${name}_${lang}.pdf" "$out/"
  done
  # where each narrated line starts in each version, for the self-test's "watch the video from here" links
  ~/code/personal/venv/bin/python ~/projects/manim-studio/line_times_page.py "$U/$src" "$cls" "$voice" "$out/times.json"
  echo "synced $page (staged)"
done
