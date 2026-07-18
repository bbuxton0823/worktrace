#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
segment_root="$project_root/video/output/segments"
public_demo_root="$project_root/public/demo"
mkdir -p "$segment_root"
mkdir -p "$public_demo_root"

narration_audio="$project_root/video/audio/worktrace-narration-elevenlabs.mp3"
if [[ ! -f "$narration_audio" ]]; then
  narration_audio="$project_root/video/audio/worktrace-narration.aiff"
fi

render_segment() {
  local image_path="$1"
  local duration="$2"
  local output_path="$3"

  ffmpeg -hide_banner -loglevel error -y \
    -loop 1 -framerate 30 -i "$image_path" -t "$duration" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf3f0e7,format=yuv420p" \
    -c:v libx264 -preset medium -crf 18 -r 30 -an "$output_path"
}

render_segment "$project_root/video/frames/00-cover.jpg" 8.2 "$segment_root/00-cover.mp4"
render_segment "$project_root/video/frames/01-operations.jpg" 13.3 "$segment_root/01-operations.mp4"
render_segment "$project_root/video/frames/02-capture-recording.jpg" 15.2 "$segment_root/02-capture.mp4"
render_segment "$project_root/video/frames/03-review-package.jpg" 15.2 "$segment_root/03-review.mp4"
render_segment "$project_root/video/frames/04-field-kit.jpg" 17.7 "$segment_root/04-field-kit.mp4"
render_segment "$project_root/video/frames/05-verticals.jpg" 11.4 "$segment_root/05-verticals.mp4"
render_segment "$project_root/video/frames/06-international.jpg" 21.5 "$segment_root/06-international.mp4"
render_segment "$project_root/video/frames/07-economics.jpg" 15.2 "$segment_root/07-economics.mp4"
render_segment "$project_root/video/frames/08-sales.jpg" 17.7 "$segment_root/08-sales.mp4"
render_segment "$project_root/video/frames/00-cover.jpg" 5.1 "$segment_root/09-cover.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$project_root/video/segments.ffconcat" \
  -c copy -movflags +faststart "$project_root/video/output/worktrace-silent.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$project_root/video/output/worktrace-silent.mp4" \
  -i "$narration_audio" \
  -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=20[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart -shortest "$project_root/video/output/worktrace-demo-explainer.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -ss 3 -i "$project_root/video/output/worktrace-demo-explainer.mp4" \
  -frames:v 1 -q:v 2 "$project_root/video/output/worktrace-demo-poster.jpg"

cp "$project_root/video/output/worktrace-demo-explainer.mp4" "$public_demo_root/worktrace-demo-explainer.mp4"
cp "$project_root/video/output/worktrace-demo-poster.jpg" "$public_demo_root/worktrace-demo-poster.jpg"
cp "$project_root/video/worktrace-explainer.vtt" "$public_demo_root/worktrace-explainer.vtt"
