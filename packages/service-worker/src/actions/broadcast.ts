import { vkApiClient } from '@vk-audiopad/common'
import { applicationState } from '../state'

export const onBroadcast = async (enabled: boolean): Promise<void> => {
    if (enabled) {
        const track = applicationState.activeTrack
        if (track != null) {
            const ownerId = track.id.split('_')[0]
            const audioId = track.id.split('_')[1]
            await vkApiClient.setBroadcast(ownerId, audioId)
        }
    } else {
        await vkApiClient.setBroadcast()
    }
}
