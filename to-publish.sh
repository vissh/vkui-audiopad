#!/bin/bash

set -e

chrome_extension_filename="vk-audiopad-chrome.zip"
firefox_extension_filename="vk-audiopad-firefox.zip"
source_code_filename="vk-audiopad-source-code.zip"

if [ "$#" -eq 0 ]; then
  # Kill a leftover build container first: it may still be writing
  # into this directory and would break the cleanup (and the name is taken).
  docker rm -f vk-audiopad-build > /dev/null 2>&1 || true
  echo 'Cleaning build artifacts (node_modules, dist)...'
  # Deterministic cleanup instead of `git clean -dfX`: it must keep .npm-cache,
  # and `git clean -X -e` does not actually protect ignored paths (git 2.54).
  rm -rf node_modules dist packages/*/node_modules packages/*/dist packages/*/build
  mkdir -p .npm-cache
  docker run -it --rm -e HOME=/tmp --name vk-audiopad-build -v "$PWD":/usr/src/app -v "$PWD/.npm-cache":/tmp/.npm --user $(id -u) -w /usr/src/app node:24-alpine /bin/sh build.sh
fi

if [ "$1" = "front" ]; then
  docker rm -f vk-audiopad-build > /dev/null 2>&1 || true
  docker run -it --rm -e HOME=/tmp --name vk-audiopad-build -v "$PWD":/usr/src/app -v "$PWD/.npm-cache":/tmp/.npm --user $(id -u) -w /usr/src/app node:24-alpine /bin/sh build.sh front
fi

(cd dist/chrome_extension && zip -r ../$chrome_extension_filename *)
(cd dist/firefox_extension && zip -r ../$firefox_extension_filename *)
git archive -o dist/$source_code_filename HEAD
