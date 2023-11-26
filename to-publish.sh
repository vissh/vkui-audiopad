#!/bin/bash

set -e

extension_filename="vk-audiopad.zip"
source_code_filename="vk-audiopad-source-code.zip"

if [ "$#" -eq 0 ]; then
  git clean -dfX
  docker run -it --rm --name vk-audiopad-build -v "$PWD":/usr/src/app --user $(id -u) -w /usr/src/app node:20-alpine /bin/sh build.sh
fi

if [ "$1" = "front" ]; then
  docker run -it --rm --name vk-audiopad-build -v "$PWD":/usr/src/app --user $(id -u) -w /usr/src/app node:20-alpine /bin/sh build.sh front
fi

(cd dist/extension && zip -r ../$extension_filename *)
git archive -o dist/$source_code_filename HEAD
