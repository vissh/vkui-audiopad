#!/bin/bash

set -e

extension_filename="vk-audiopad.zip"
source_code_filename="vk-audiopad-source-code.zip"

if [ "$#" -eq 0 ] || [ "$1" != "noclean" ]; then
  git clean -dfX
fi

docker run -it --rm --name vk-audiopad-build -v "$PWD":/usr/src/app --user $(id -u) -w /usr/src/app node:20-alpine /bin/sh build.sh
(cd dist/extension && zip -r ../$extension_filename *)
git archive -o dist/$source_code_filename HEAD
