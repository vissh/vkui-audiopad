const { argv, stdout } = require('node:process');

const chromeValues = {
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "permissions": [
    "declarativeNetRequest",
    "offscreen",
    "storage"
  ],
}

const firefoxValues = {
  "browser_specific_settings": {
    "gecko": {
      "id": "{a489e182-af99-4bd3-bbef-d5325702bbcd}",
      "strict_min_version": "113.0"
    }
  },
  "background": {
    "page": "offscreen.html",
  },
  "permissions": [
    "declarativeNetRequest",
    "storage"
  ],
}

const commonManifest = {
  "name": "vk audiopad – VK Музыка бесплатно без рекламы",
  "description": "С плеером для ВК Музыки, вы можете слушать музыку из ВКонтакте бесплатно и без рекламы",
  "author": "Denis Matveev <unsumulum@gmail.com>",
  "version": "3.3.7",
  "manifest_version": 3,
  "minimum_chrome_version": "116",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "index.html"
  },
  "commands": {
    "010-play-pause": {
      "description": "Воспроизведение/Пауза",
      "suggested_key": {
        "default": "Ctrl+Shift+5"
      },
      "global": true
    },
    "020-previous": {
      "description": "Предыдущий трек",
      "suggested_key": {
        "default": "Ctrl+Shift+6"
      },
      "global": true
    },
    "030-next": {
      "description": "Следующий трек",
      "suggested_key": {
        "default": "Ctrl+Shift+7"
      },
      "global": true
    },
    "050-shuffle": {
      "description": "Слушать в перемешку"
    },
    "060-loop": {
      "description": "Повтор"
    }
  },
  "host_permissions": [
    "*://*.vk.com/*"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "vkcom",
        "enabled": true,
        "path": "rules/vkcom.json"
      }
    ]
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}

if (argv[2] === 'chrome') {
  stdout.write(JSON.stringify({ ...commonManifest, ...chromeValues }, null, 2))
}

if (argv[2] === 'firefox') {
  stdout.write(JSON.stringify({ ...commonManifest, ...firefoxValues }, null, 2))
}
