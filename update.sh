#!/bin/bash
set -e

echo 'Update common packages...'
(cd packages/common && npm update)
echo 'Common packages updated.'

echo -e '\nUpdate front packages...'
(cd packages/front && npm update)
echo 'Front packages updated.'

echo -e '\nUpdate back packages...'
(cd packages/back && npm update)
echo 'Back packages updated.'
