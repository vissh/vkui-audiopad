import { commitPlayback, isCurrentPlayer } from '../playback-operation'

export const onPause = async (playbackId: string): Promise<void> => {
  await commitPlayback(() => isCurrentPlayer(playbackId), { played: false })
}
