#!/bin/bash

set -e

if [ "$#" -eq 0 ]; then
    echo 'Building common lib...'
    (cd packages/common && npm install && npm run build)
    echo 'Common lib builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "back" ]; then
    echo -e '\nBuilding back...'
    (cd packages/back && npm install && npm run build)
    echo 'Back builded.'
fi

if [ "$#" -eq 0 ] || [ "$1" = "front" ]; then
    echo -e '\nBuilding front...'
    (cd packages/front && npm install && npm run build)
    echo 'Front builded.'
fi

echo -e '\nCopying files...'
rm -rf extension/ &&
    mkdir extension &&
    cp -r packages/front/build/* extension/ &&
    cp -r packages/back/dist/* extension/ &&
    cp -r public/* extension/
echo 'Done!'
