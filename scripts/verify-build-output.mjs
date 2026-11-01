import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let failed = false
const fail = (msg) => { console.error('FAIL: ' + msg); failed = true }

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

const checkBrowser = (browser, expectsServiceWorker) => {
  const dir = join('dist', `${browser}_extension`)
  const manifestFile = join(dir, 'manifest.json')

  if (!existsSync(manifestFile)) {
    fail(`${manifestFile} not found`)
    return
  }

  let manifest
  try {
    manifest = readJson(manifestFile)
  } catch (e) {
    fail(`${manifestFile} is not valid JSON: ${e.message}`)
    return
  }

  if (manifest.manifest_version !== 3) {
    fail(`${browser}: manifest_version must be 3, got ${manifest.manifest_version}`)
  }
  for (const key of ['name', 'version', 'description', 'icons', 'action']) {
    if (manifest[key] == null) {
      fail(`${browser}: missing "${key}" in manifest`)
    }
  }
  if (manifest.action?.default_popup !== 'index.html') {
    fail(`${browser}: action.default_popup must be index.html`)
  }

  if (expectsServiceWorker) {
    if (manifest.background?.service_worker !== 'service-worker.js') {
      fail(`${browser}: background.service_worker must be service-worker.js`)
    }
  } else {
    if (manifest.background?.page !== 'offscreen.html') {
      fail(`${browser}: background.page must be offscreen.html`)
    }
    const geckoId = manifest.browser_specific_settings?.gecko?.id
    if (typeof geckoId !== 'string' || geckoId.length === 0) {
      fail(`${browser}: browser_specific_settings.gecko.id is missing`)
    }
  }

  for (const file of ['index.html', 'service-worker.js', 'offscreen.html', 'environment.json', 'rules/vkcom.json']) {
    if (!existsSync(join(dir, file))) {
      fail(`${browser}: expected file "${file}" not found in dist`)
    }
  }

  const env = readJson(join(dir, 'environment.json'))
  if (env['offscreen-document-support'] !== expectsServiceWorker) {
    fail(`${browser}: offscreen-document-support must be ${expectsServiceWorker}, got ${env['offscreen-document-support']}`)
  }
}

checkBrowser('chrome', true)
checkBrowser('firefox', false)

if (failed) {
  process.exit(1)
}
console.log('OK: build output verified for chrome and firefox')
