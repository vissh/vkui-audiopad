import { commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { setBadgeText } from '../utils'

export const onDurationMode = (mode: commonTypes.DurationMode | undefined): void => {
  const [duration, currentTime] = [applicationState.duration ?? 0, Math.floor(applicationState.currentTime)]
  setBadgeText(mode ?? commonTypes.DurationMode.TIME_PASSED, duration, currentTime)
}
