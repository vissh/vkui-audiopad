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
  const identity = { userId: '1', epoch: 'synthetic-smoke-epoch' }
  const token = { userId: identity.userId, accessToken: 'synthetic-smoke-token', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
  await extension.storage.local.set({ userId: identity.userId, sessionEpoch: identity.epoch, webToken: token })
  const sessionRequest = async operation => {
    const requestId = crypto.randomUUID()
    const reply = await extension.runtime.sendMessage({ target: targets.SERVICE_WORKER, type: types.SESSION_REQUEST, requestId, operation })
    if (reply?.requestId !== requestId) throw new Error('Firefox session reply correlation failed')
    return reply
  }
  const session = await sessionRequest({ kind: 'token', identity })
  if (session.ok !== true || session.snapshot?.identity.epoch !== identity.epoch || session.snapshot?.token.accessToken !== token.accessToken) throw new Error('Firefox cached session round trip failed')
  const stale = await sessionRequest({ kind: 'assert', identity: { ...identity, epoch: 'retired-smoke-epoch' } })
  if (stale.ok !== false || stale.error?.kind !== 'session-changed') throw new Error('Firefox session accepted a retired identity')
  const malformed = await sessionRequest({ kind: 'refresh' })
  if (malformed.ok !== false || malformed.error?.kind !== 'format') throw new Error('Firefox session accepted malformed input')
  await extension.storage.local.remove(['userId', 'sessionEpoch', 'webToken'])
  return {
    firefoxVersion: /Firefox\/([\d.]+)/.exec(navigator.userAgent)?.[1] ?? 'unknown',
    ready: true,
    paused: true,
    emptyAudio: true,
    snapshotRoundTrip: true,
    repeatModes: modes,
    sessionRoundTrip: true,
    sessionRejectsStale: true,
    sessionRejectsMalformed: true,
    backgroundScripts: [...background.document.scripts].map(script => script.src.split('/').pop())
  }
}
