#!/bin/bash

set -e

chrome_dir="chrome_extension"
firefox_dir="firefox_extension"

if [ ! -x node_modules/.bin/tsc ]; then
  echo 'Installing dependencies...'
  npm ci
fi

if [ "$#" -eq 0 ] || [ ! -d packages/common/dist ]; then
  echo 'Building common lib...'
  npm run build -w @vk-audiopad/common
  echo '`common-lib` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "offscreen" ]; then
  echo -e '\nBuilding offscreen...'
  npm run build -w @vk-audiopad/offscreen
  echo '`offscreen` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "service-worker" ]; then
  echo -e '\nBuilding service-worker...'
  npm run build -w @vk-audiopad/service-worker
  echo '`service-worker` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "front" ]; then
  echo -e '\nBuilding front...'
  npm run build -w @vk-audiopad/front
  echo '`front` builded.'
fi

echo -e '\nCopying files...'

rm -rf dist/ &&
  mkdir -p dist/$chrome_dir &&
  cp -r packages/front/dist/* dist/$chrome_dir/ &&
  cp -r packages/offscreen/dist/* dist/$chrome_dir/ &&
  cp -r packages/service-worker/dist/* dist/$chrome_dir/ &&
  cp -r public/* dist/$chrome_dir/

mkdir -p dist/$firefox_dir &&
  cp -r dist/$chrome_dir/* dist/$firefox_dir

(rm dist/$chrome_dir/environment-firefox.json &&
  mv dist/$chrome_dir/environment-chrome.json dist/$chrome_dir/environment.json)
(rm dist/$firefox_dir/environment-chrome.json &&
  mv dist/$firefox_dir/environment-firefox.json dist/$firefox_dir/environment.json)

node dist/$chrome_dir/manifest.js chrome >>dist/$chrome_dir/manifest.json
node dist/$firefox_dir/manifest.js firefox >>dist/$firefox_dir/manifest.json

rm dist/*/manifest.js

echo 'Done!'
