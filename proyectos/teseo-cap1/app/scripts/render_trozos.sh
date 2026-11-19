#!/bin/bash
# Renderiza el video en trozos de 240 cuadros (si algo se corta, se retoma donde quedó) y luego los une.
cd "$(dirname "$0")/.."
mkdir -p out/trozos
TOTAL=2238; STEP=240
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=$(printf "out/trozos/t%04d.mp4" $a)
  [ -s "$f" ] && continue
  node scripts/render.mjs "$f.tmp.mp4" $a $b 1 ${HILOS:-4} && mv "$f.tmp.mp4" "$f" || exit 1
done
ls out/trozos/t*.mp4 | sed "s|out/trozos/|file '|; s|$|'|" > out/trozos/lista.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i out/trozos/lista.txt -c copy out/video_mudo.mp4 && echo "VIDEO MUDO LISTO"
