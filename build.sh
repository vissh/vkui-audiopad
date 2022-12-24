#!/bin/bash
echo 'Building common lib...'
(cd packages/common && npm run build)
echo 'Common lib builded.'

echo 'Building front...'
(cd packages/front && npm run build)
echo 'Front builded.'

echo 'Building back...'
# (cd packages/back && npm run build)
echo 'Back builded.'

echo 'Copying files...'
rm -rf extension/ \
    && mkdir extension \
    && cp -r packages/front/build/* extension/ \
    && cp -r public/* extension/
echo 'Done!'
