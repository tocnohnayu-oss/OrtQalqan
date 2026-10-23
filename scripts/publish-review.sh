#!/usr/bin/env bash
set -euo pipefail

# Generated demo screenshots only. Keep application source and user data on main.
task_review_dir=$(mktemp -d)
trap 'rm -rf "$task_review_dir"' EXIT
cp qa/desktop-ru.png "$task_review_dir/desktop.png"
cp qa/mobile-kk.png "$task_review_dir/mobile.png"
cp qa/mobile-room-kk.png "$task_review_dir/mobile-room.png"
cp qa/mobile-map-kk.png "$task_review_dir/mobile-map.png"
cp qa/checks.json "$task_review_dir/checks.json"

if git ls-remote --exit-code --heads origin design-review >/dev/null 2>&1; then
  git fetch origin design-review
  git checkout -B design-review FETCH_HEAD
else
  git checkout --orphan design-review
  git rm -rf --ignore-unmatch .
fi

mkdir -p review
cp "$task_review_dir/desktop.png" review/desktop.png
cp "$task_review_dir/mobile.png" review/mobile.png
cp "$task_review_dir/mobile-room.png" review/mobile-room.png
cp "$task_review_dir/mobile-map.png" review/mobile-map.png
cp "$task_review_dir/checks.json" review/checks.json
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add review/desktop.png review/mobile.png review/mobile-room.png review/mobile-map.png review/checks.json
if ! git diff --cached --quiet; then
  git commit -m 'docs: refresh generated design review images'
  git push origin HEAD:refs/heads/design-review
fi
