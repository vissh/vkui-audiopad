#!/bin/bash
set -e

echo 'Building common lib...'
(cd packages/common && npm run build)
echo 'Common lib builded.'

echo -e '\nBuilding front...'
(cd packages/front && npm run build)
echo 'Front builded.'

echo -e '\nBuilding back...'
(cd packages/back && npm run build)
echo 'Back builded.'

echo -e '\nCopying files...'
rm -rf extension/ \
    && mkdir extension \
    && cp -r packages/front/build/* extension/ \
    && cp -r packages/back/dist/* extension/ \
    && cp -r public/* extension/
echo 'Done!'
