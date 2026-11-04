// This function is serialized into a temporary extension page by the smoke runner.
export const runFirefoxSmoke = async ({ targets, types, repeatModes }) => {
  const extension = globalThis.browser
  const background = await extension.runtime.getBackgroundPage()
  const waitFor = async (read, accepts) => {
    const deadline = Date.now() + 4000
    while (Date.now() < deadline) {
      const value = await read()
      if (accepts(value)) return value
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    throw new Error('Firefox runtime smoke timed out')
  }
  const state = await waitFor(() => extension.storage.local.get(['playbackInitialization', 'played', 'playbackError']), state => state.playbackInitialization === 'ready' || state.playbackInitialization === 'failed')
  if (state.playbackInitialization !== 'ready' || state.played !== false || state.playbackError != null) throw new Error('Firefox startup did not become ready and paused')
  const environment = await (await fetch(extension.runtime.getURL('environment.json'))).json()
  if (environment['offscreen-document-support'] !== false) throw new Error('Expected Firefox background-document transport')
  const bridge = background.document.getElementById('custom-events')
  if (bridge == null) throw new Error('Firefox bridge missing')
  const snapshot = await new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID()
    const cleanup = () => { clearTimeout(timer); bridge.removeEventListener(types.PLAYER_SNAPSHOT, receive) }
    const receive = event => {
      if (event.detail.requestId !== requestId) return
      cleanup()
      resolve(event.detail.snapshot)
    }
    const timer = setTimeout(() => { cleanup(); reject(new Error('Firefox snapshot reply missing')) }, 2000)
    bridge.addEventListener(types.PLAYER_SNAPSHOT, receive)
    extension.runtime.sendMessage({ target: targets.OFFSCREEN, type: types.GET_PLAYER_SNAPSHOT, requestId }).catch(() => { cleanup(); reject(new Error('Firefox runtime send failed')) })
  })
  if (snapshot.hasSource || snapshot.playbackId != null || !snapshot.paused || snapshot.playing) throw new Error('Fresh audio snapshot was not empty and paused')
  const modes = []
  for (const mode of [repeatModes.REPEAT, repeatModes.REPEAT_ONE, repeatModes.NONE]) {
    await extension.runtime.sendMessage({ target: targets.SERVICE_WORKER, type: types.REPEAT })
    await waitFor(() => extension.storage.local.get('repeat'), state => state.repeat === mode)
    modes.push(mode)
  }
  return {
    firefoxVersion: /Firefox\/([\d.]+)/.exec(navigator.userAgent)?.[1] ?? 'unknown',
    ready: true,
    paused: true,
    emptyAudio: true,
    snapshotRoundTrip: true,
    repeatModes: modes,
    backgroundScripts: [...background.document.scripts].map(script => script.src.split('/').pop())
  }
}
