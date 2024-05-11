import { playOrPause } from '../offscreen/play-or-pause'

export const onPlayed = async (played: boolean | undefined): Promise<void> => {
  if (played == null || !played) {
    void chrome.action.setBadgeText({ text: '' })
  }

  await playOrPause(Boolean(played))
}
