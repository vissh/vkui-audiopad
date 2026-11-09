import { commonTypes } from '@vk-audiopad/common'
import { useEffect, useRef } from 'react'
import { sendMessage } from '@/shared/lib/send-message'

let pendingSelection: AbortController | null = null

export const usePlaylistSelection = (source: unknown, userId: string, active: boolean, load: (signal: AbortSignal) => Promise<commonTypes.Playlist>) => {
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [source, userId])

  return async () => {
    pendingSelection?.abort()
    pendingSelection = null
    if (active) {
      sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
      return
    }
    const controller = new AbortController()
    pendingSelection = controller
    request.current = controller
    try {
      const playlist = await load(controller.signal)
      if (controller.signal.aborted) return
      if (playlist.tracks.length === 0 && !playlist.isVkMix) throw new Error('Empty playlist')
      sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ACTIVE_TRACK, trackId: null, playlist })
    } catch (error) {
      if (!controller.signal.aborted) throw error
    } finally {
      if (pendingSelection === controller) pendingSelection = null
      if (request.current === controller) request.current = null
    }
  }
}
