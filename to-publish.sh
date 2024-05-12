#!/bin/bash

set -e

chrome_extension_filename="vk-audiopad-chrome.zip"
firefox_extension_filename="vk-audiopad-firefox.zip"
source_code_filename="vk-audiopad-source-code.zip"

if [ "$#" -eq 0 ]; then
  git clean -dfX
  docker run -it --rm --name vk-audiopad-build -v "$PWD":/usr/src/app --user $(id -u) -w /usr/src/app node:20-alpine /bin/sh build.sh
fi

if [ "$1" = "front" ]; then
  docker run -it --rm --name vk-audiopad-build -v "$PWD":/usr/src/app --user $(id -u) -w /usr/src/app node:20-alpine /bin/sh build.sh front
fi

(cd dist/chrome_extension && zip -r ../$chrome_extension_filename *)
(cd dist/firefox_extension && zip -r ../$firefox_extension_filename *)
git archive -o dist/$source_code_filename HEAD
