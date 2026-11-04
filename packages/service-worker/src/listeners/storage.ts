import { onDurationMode } from '../actions/duration-mode'
import { onShuffle } from '../actions/shuffle'
import { onBroadcast } from '../actions/broadcast'
import { updateVolume } from '../offscreen/update-volume'
import { storage } from '../storage'

import { applicationState } from '../state'
import { type Readiness } from '../readiness'

export const startListeningStorageEvents = (readiness: Readiness): void => {
  storage.durationMode.listen(value => { readiness.run(() => { onDurationMode(value) }) })
  storage.volume.listen((value) => { readiness.run(async () => { await updateVolume(value ?? 0) }) })
  storage.shuffle.listen((shuffle) => { readiness.run(async () => { await onShuffle(shuffle) }) })
  storage.castToStatus.listen((castToStatus) => { readiness.run(async () => { await onBroadcast(castToStatus ?? false) }) })
  storage.activeTrack.listen((activeTrack) => {
    readiness.run(async () => {
      if (applicationState.castToStatus && activeTrack != null) await onBroadcast(true, activeTrack)
    })
  })
}
