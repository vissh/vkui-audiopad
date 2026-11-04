#!/bin/sh

set -eu

package_manager=$(node -p 'require("./package.json").packageManager')
npm_version=${package_manager#npm@}

if [ "$(npm --version)" != "$npm_version" ]; then
  npm install --prefix /tmp/vk-audiopad-toolchain --no-package-lock --ignore-scripts --no-fund --no-audit "$package_manager"
  PATH="/tmp/vk-audiopad-toolchain/node_modules/.bin:$PATH"
  export PATH
fi

exec /bin/sh build.sh "$@"
