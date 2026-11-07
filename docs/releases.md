# Release extension packages

The [Release extension workflow](../.github/workflows/release.yml) accepts a new version through GitHub's interface, prepares its commit, runs checks and tests, then pushes the version commit to master and creates a matching tag and GitHub Release with Chrome, Firefox and source ZIPs. Uploading to Chrome Web Store or Firefox Add-ons remains manual; store credentials are not needed by this workflow.

## Prepare a version

Merge the code you want to ship into master. You do not need to edit or push the version yourself: enter the next version, for example `3.3.10`, in the workflow form. The workflow updates only `commonManifest.version` in [public/manifest.js](../public/manifest.js) and prepares a `chore(release): v3.3.10` commit. Use numeric version components without leading zeros; the version must exceed the manifest version and existing numeric release tags. Keep it higher than the last upload in each store. Root/workspace package.json versions are not the extension version.

One-time setup: merge the workflow and its helper scripts into the default branch (`master`) for its manual launch button to appear. GitHub Actions must be enabled, and repository/organization policy must permit the release job's `contents: write` permission to update master and create tags/releases. No personal access token is required; the job uses GitHub's built-in `GITHUB_TOKEN`. A protected branch that requires PRs for every update will reject this direct version commit; configure an explicit GitHub App/bypass policy or use a release-PR workflow instead. This workflow does not change repository protections.

## Run from GitHub

1. Open the repository's **Actions → Release extension → Run workflow**.
2. Keep the branch set to **master** and enter the new extension version. Leave **Keep the GitHub Release as a draft for review** checked for a private review, or uncheck it to publish the GitHub Release immediately.
3. Click **Run workflow**. This captures master and prepares the version commit locally on the runner. No remote change happens until verification succeeds.
4. After success, open **Releases** and download the assets. With the default option, open the draft while signed in with repository write access. Publish that draft when it is ready to be public.

The read-only build job prepares a local version commit, installs pinned Node/npm and lockfile dependencies, audits critical advisories, runs `check` and `test`, builds both distributions, verifies the build output and runs the isolated Firefox runtime smoke. Packaging rejects tracked or untracked checkout changes, including lockfile drift. The candidate source ZIP includes the prepared version commit. A Git bundle preserves that exact commit for the next job.

Only after these steps pass does the release job receive write permission. It checks the downloaded candidate's checksums and commit identity, imports the prepared commit, and pushes master plus its version tag atomically without force. If master changed during the build, the push stops and a fresh workflow run is required. It creates the release from the same retained ZIPs rather than rebuilding them. Commits pushed with GITHUB_TOKEN do not ordinarily start another push-triggered CI workflow; the release workflow itself runs the required checks.

For version `3.3.10`, the output is:

| Asset | Use |
|---|---|
| `vk-audiopad-3.3.10-chrome.zip` | Upload to the Chrome Web Store developer dashboard; manifest.json is at the ZIP root. |
| `vk-audiopad-3.3.10-firefox.zip` | Upload as a new version in Firefox Add-ons Developer Hub; this is an unsigned submission package. Mozilla signs it during its process. |
| `vk-audiopad-3.3.10-source.zip` | Matching committed source, lockfile and build instructions for Mozilla source review. |
| `release.json` | Version, `v3.3.10` tag, exact commit and build toolchain identity. |
| `SHA256SUMS` | SHA-256 hashes of the three ZIPs and release.json. |

The source ZIP is explicitly attached in addition to GitHub's automatic source downloads. Neither source archive contains node_modules or generated distributions. Store-specific declarations, listing information and review still happen in the store dashboards; a successful workflow does not establish store acceptance. See [testing](ai/testing.md) for authenticated/manual browser checks before submission.

## Failures and retries

Failed checks or packaging stop before any remote version commit or tag. The `release-candidate` and `release-commit` Actions artifacts retain the verified files and commit bundle for 30 days if release creation fails later. A release is never overwritten. To ship different code, use a newer version and run again.

If the atomic push succeeded but release creation failed, use **Re-run failed jobs**, which reuses the already verified commit and artifacts. Do not rerun all jobs: preparation expects an increasing version, and a newly generated commit must not replace the original tag. The publish job can reuse an existing tag only when it points directly to the same prepared commit and no release exists. If a draft or published release already exists, open that release. Do not move release tags to different code. Branch/tag rules must allow the workflow's release identity.

Amending or re-signing a commit changes its ID even when every file is identical. Finalize commit identity before preparing release assets or creating a tag: an existing tag does not follow a rewritten branch. Published tags and retained candidates stay on the revision that was actually verified; corrections use a new version. The workflow's bot commit is unsigned and its tag is lightweight; personal signing credentials are not required for contributions. A policy requiring signed release commits needs a separately configured signing identity/workflow before publication.

## Rollback and compatibility

The release workflow packages verified files; it does not establish storage compatibility with an older extension. UPDATE currently clears runtime data while retaining settings. Versioned migrations and tested downgrade/recovery scenarios remain [T11](ai/development-roadmap.md#t11-version-persisted-state). Prefer a corrective release with a higher version after validating its state transition; do not move a published tag or assume reinstalling restores the previous queue.

## Build from the source archive

Extract the source ZIP and open its top-level directory. Use macOS/Linux or a Linux environment on Windows, Git, `zip`/`unzip`, Node from `.node-version` and npm from `packageManager` in package.json. The ordinary build does not require GitHub access, Docker, VK login or store credentials.

```bash
npm install --global npm@11.19.1
node scripts/doctor.mjs --runtime-only
npm ci
npm run check
npm test
./build.sh
npm run verify:build
```

The browser packages are assembled in `dist/chrome_extension` and `dist/firefox_extension`. ZIP each directory's contents with manifest.json at the root when rebuilding submission files. The source archive has no .git directory, so `release:package` is for Git checkouts only. Build resources are verified by `verify:build`; bit-for-bit identical ZIPs and full store lint/resource validation are not currently promised.

## Package locally from a Git checkout

After committing changes and completing the same check/test/full-build sequence above, run:

```bash
npm run release:package
```

This requires Git and `zip`/`unzip` and writes only `dist/release`, replacing previous candidate files there. It checks that both generated manifests match public/manifest.js and verifies build output before packaging. Source is archived from HEAD, so use a fresh full build from that same clean checkout; the GitHub workflow enforces this sequence in a fresh runner. The local command does not create tags or publish releases and does not rerun the full checks/tests or browser smoke.

The older `./to-publish.sh` Docker helper remains available, but cleans local dependencies/build output and packages the working tree separately from HEAD source. Prefer the GitHub workflow for releases from a verified revision, and `./build.sh` for normal development.
