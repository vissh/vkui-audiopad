#!/bin/bash

set -e

chrome_dir="chrome_extension"
firefox_dir="firefox_extension"

if [ "$#" -eq 0 ]; then
  echo 'Building common lib...'
  (cd packages/common && npm install && npm run build)
  echo '`common-lib` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "offscreen" ]; then
  echo -e '\nBuilding offscreen...'
  (cd packages/offscreen && npm install && npm run build)
  echo '`offscreen` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "service-worker" ]; then
  echo -e '\nBuilding service-worker...'
  (cd packages/service-worker && npm install && npm run build)
  echo '`service-worker` builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "front" ]; then
  echo -e '\nBuilding front...'
  (cd packages/front && npm install && npm run build)
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
