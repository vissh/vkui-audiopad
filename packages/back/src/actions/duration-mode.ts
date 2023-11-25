import { commonTypes } from '@vk-audiopad/common'
import { setBadgeText } from '../utils'

export const onDurationMode = (mode: commonTypes.DurationMode | undefined): void => {
  setBadgeText(mode ?? commonTypes.DurationMode.TIME_PASSED)
}
