#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?}" "${RELEASE_VERSION:?}" "${RELEASE_COMMIT:?}" "${GITHUB_SHA:?}" "${RUNNER_TEMP:?}"

if gh release view "$RELEASE_TAG" > /dev/null 2>&1; then
  echo "Release $RELEASE_TAG already exists. Open it or choose a newer version."
  exit 1
fi
git fetch "$RUNNER_TEMP/release.bundle" HEAD
test "$(git rev-parse FETCH_HEAD)" = "$RELEASE_COMMIT"
test "$(git rev-parse "$RELEASE_COMMIT^")" = "$GITHUB_SHA"

remote_branch=$(git ls-remote origin refs/heads/master | cut -f1)
if [ "$remote_branch" != "$GITHUB_SHA" ] && [ "$remote_branch" != "$RELEASE_COMMIT" ]; then
  echo 'master changed during the build. Run a new workflow against its latest revision.'
  exit 1
fi
remote_tag=$(git ls-remote origin "refs/tags/$RELEASE_TAG" | cut -f1)
if [ -n "$remote_tag" ] && [ "$remote_tag" != "$RELEASE_COMMIT" ]; then
  echo "Tag $RELEASE_TAG already points to another revision."
  exit 1
fi

git push --atomic origin "$RELEASE_COMMIT:refs/heads/master" "$RELEASE_COMMIT:refs/tags/$RELEASE_TAG"

cat > "$RUNNER_TEMP/release-notes.md" <<EOF
Built from commit $RELEASE_COMMIT after checks, tests, full build and Firefox runtime smoke.

- Chrome Web Store: vk-audiopad-$RELEASE_VERSION-chrome.zip
- Firefox Add-ons upload (unsigned): vk-audiopad-$RELEASE_VERSION-firefox.zip
- Matching source for review: vk-audiopad-$RELEASE_VERSION-source.zip
- Build identity: release.json; SHA-256 checksums: SHA256SUMS

Store submission remains manual. See docs/releases.md in the source archive for build instructions.
EOF
args=()
if [ "${RELEASE_DRAFT:-true}" = 'true' ]; then args+=(--draft); fi
gh release create "$RELEASE_TAG" release/* --verify-tag \
  --title "VK Audiopad $RELEASE_VERSION" \
  --notes-file "$RUNNER_TEMP/release-notes.md" "${args[@]}"
echo "Created $RELEASE_TAG from $RELEASE_COMMIT (draft: ${RELEASE_DRAFT:-true})." >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
