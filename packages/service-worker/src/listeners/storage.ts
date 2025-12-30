import { onDurationMode } from '../actions/duration-mode'
import { onPlayed } from '../actions/play-or-pause'
import { onShuffle } from '../actions/shuffle'
import { onBroadcast } from '../actions/broadcast'
import { updateVolume } from '../offscreen/update-volume'
import { storage } from '../storage'

export const startListeningStorageEvents = (): void => {
  storage.durationMode.listen(onDurationMode)
  storage.volume.listen((value) => { void updateVolume(value ?? 0) })
  storage.played.listen((played) => { void onPlayed(played) })
  storage.shuffle.listen((shuffle) => { void onShuffle(shuffle) })
  storage.castToStatus.listen((castToStatus) => { void onBroadcast(castToStatus ?? false) })
}
