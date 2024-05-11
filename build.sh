#!/bin/bash

set -e

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
  mkdir -p dist/extension &&
  cp -r packages/front/dist/* dist/extension/ &&
  cp -r packages/offscreen/dist/* dist/extension/ &&
  cp -r packages/service-worker/dist/* dist/extension/ &&
  cp -r public/* dist/extension/
echo 'Done!'
