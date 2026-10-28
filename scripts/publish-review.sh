#!/usr/bin/env bash
set -euo pipefail

# Generated demo screenshots only. Keep application source and user data on main.
task_review_dir=$(mktemp -d)
trap 'rm -rf "$task_review_dir"' EXIT
cp qa/desktop-ru.png "$task_review_dir/desktop.png"
cp qa/mobile-kk.png "$task_review_dir/mobile.png"
cp qa/mobile-room-kk.png "$task_review_dir/mobile-room.png"
cp qa/mobile-map-kk.png "$task_review_dir/mobile-map.png"
cp qa/scenarios-ru.png "$task_review_dir/scenarios.png"
cp qa/report-ru.pdf "$task_review_dir/report-ru.pdf"
cp qa/report-kk.pdf "$task_review_dir/report-kk.pdf"
cp qa/inspection-ru.png "$task_review_dir/inspection.png"
cp qa/mobile-inspection-kk.png "$task_review_dir/mobile-inspection.png"
cp qa/objects-ru.png "$task_review_dir/objects.png"
cp qa/warehouse-ru.png "$task_review_dir/warehouse.png"
cp qa/brand.png "$task_review_dir/brand.png"
cp qa/desktop-empty.png "$task_review_dir/desktop-empty.png"
cp qa/editor-ru.png "$task_review_dir/editor.png"
cp qa/editor-mobile-kk.png "$task_review_dir/editor-mobile.png"
cp qa/floor.svg "$task_review_dir/floor.svg"
cp qa/checks.json "$task_review_dir/checks.json"

for task_account_image in account-entry team-objects team-members team-activity team-mobile-kk team-members-mobile-kk account-entry-mobile-kk profile-desktop profile-mobile-kk guide-welcome guide-desktop guide-mobile-kk guide-mobile-plan-kk demo-plan demo-result demo-result-mobile-kk navigation-desktop navigation-mobile-kk field-search-desktop field-search-mobile-kk field-asset-desktop field-asset-mobile-kk field-room-mobile-kk identity-empty-desktop identity-empty-mobile-kk identity-plan-desktop identity-tablet-kk identity-params-mobile-kk identity-long-title-mobile-kk identity-types folio-focus-desktop folio-editor-desktop folio-focus-mobile-kk folio-editor-mobile-kk folio-image-mobile-kk labels-desktop labels-mobile-kk labels-selected-mobile-kk labels-editor-mobile-kk labels-dense-mobile-kk room-context-desktop room-context-mobile-kk room-result-mobile-kk room-unplaced-mobile-kk room-image-mobile-kk signature-desktop signature-room-desktop signature-search-desktop signature-mobile-kk signature-empty-mobile-kk signature-empty-desktop signature-symbols attention-desktop attention-dates-desktop attention-mobile-kk attention-empty-mobile-kk building-atlas-desktop building-atlas-field-desktop building-atlas-flat-desktop building-atlas-mobile-kk building-atlas-empty-desktop global-search-desktop global-search-mobile-kk building-atlas-example-desktop model-workspace-desktop model-room-desktop model-focus-mobile-kk model-room-mobile-kk continuity-model-desktop continuity-sources-desktop continuity-model-mobile-kk continuity-sources-mobile-kk workspace-desktop workspace-cutaway-desktop workspace-tablet-kk workspace-mobile-kk workspace-parameters-mobile-kk search-location-desktop search-location-model-desktop search-location-mobile-kk search-location-image-mobile-kk search-location-model-mobile-kk walk-review-desktop walk-review-selection-desktop walk-review-mobile-kk walk-review-draft-mobile-kk; do
  cp "qa/$task_account_image.png" "$task_review_dir/$task_account_image.png"
done

cp qa/attention-report-kk.pdf "$task_review_dir/attention-report-kk.pdf"
cp qa/demo-report-ru.pdf "$task_review_dir/demo-report-ru.pdf"

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
cp "$task_review_dir/scenarios.png" review/scenarios.png
cp "$task_review_dir/report-ru.pdf" review/report-ru.pdf
cp "$task_review_dir/report-kk.pdf" review/report-kk.pdf
cp "$task_review_dir/inspection.png" review/inspection.png
cp "$task_review_dir/mobile-inspection.png" review/mobile-inspection.png
cp "$task_review_dir/objects.png" review/objects.png
cp "$task_review_dir/warehouse.png" review/warehouse.png
cp "$task_review_dir/brand.png" review/brand.png
cp "$task_review_dir/desktop-empty.png" review/desktop-empty.png
cp "$task_review_dir/editor.png" review/editor.png
cp "$task_review_dir/editor-mobile.png" review/editor-mobile.png
cp "$task_review_dir/floor.svg" review/floor.svg
cp "$task_review_dir/checks.json" review/checks.json
for task_account_image in account-entry team-objects team-members team-activity team-mobile-kk team-members-mobile-kk account-entry-mobile-kk profile-desktop profile-mobile-kk guide-welcome guide-desktop guide-mobile-kk guide-mobile-plan-kk demo-plan demo-result demo-result-mobile-kk navigation-desktop navigation-mobile-kk field-search-desktop field-search-mobile-kk field-asset-desktop field-asset-mobile-kk field-room-mobile-kk identity-empty-desktop identity-empty-mobile-kk identity-plan-desktop identity-tablet-kk identity-params-mobile-kk identity-long-title-mobile-kk identity-types folio-focus-desktop folio-editor-desktop folio-focus-mobile-kk folio-editor-mobile-kk folio-image-mobile-kk labels-desktop labels-mobile-kk labels-selected-mobile-kk labels-editor-mobile-kk labels-dense-mobile-kk room-context-desktop room-context-mobile-kk room-result-mobile-kk room-unplaced-mobile-kk room-image-mobile-kk signature-desktop signature-room-desktop signature-search-desktop signature-mobile-kk signature-empty-mobile-kk signature-empty-desktop signature-symbols attention-desktop attention-dates-desktop attention-mobile-kk attention-empty-mobile-kk building-atlas-desktop building-atlas-field-desktop building-atlas-flat-desktop building-atlas-mobile-kk building-atlas-empty-desktop global-search-desktop global-search-mobile-kk building-atlas-example-desktop model-workspace-desktop model-room-desktop model-focus-mobile-kk model-room-mobile-kk continuity-model-desktop continuity-sources-desktop continuity-model-mobile-kk continuity-sources-mobile-kk workspace-desktop workspace-cutaway-desktop workspace-tablet-kk workspace-mobile-kk workspace-parameters-mobile-kk search-location-desktop search-location-model-desktop search-location-mobile-kk search-location-image-mobile-kk search-location-model-mobile-kk walk-review-desktop walk-review-selection-desktop walk-review-mobile-kk walk-review-draft-mobile-kk; do
  cp "$task_review_dir/$task_account_image.png" "review/$task_account_image.png"
  git add "review/$task_account_image.png"
done
cp "$task_review_dir/attention-report-kk.pdf" review/attention-report-kk.pdf
git add review/attention-report-kk.pdf
cp "$task_review_dir/demo-report-ru.pdf" review/demo-report-ru.pdf
git add review/demo-report-ru.pdf
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add review/desktop.png review/mobile.png review/mobile-room.png review/mobile-map.png review/scenarios.png review/report-ru.pdf review/report-kk.pdf review/checks.json review/inspection.png review/mobile-inspection.png review/objects.png review/warehouse.png review/brand.png review/desktop-empty.png review/editor.png review/editor-mobile.png review/floor.svg
if ! git diff --cached --quiet; then
  git commit -m 'docs: refresh generated design review images'
  git push origin HEAD:refs/heads/design-review
fi
