import { vkApiClient, type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'

export const onBroadcast = async (enabled: boolean, trackOverride?: commonTypes.TrackItem): Promise<void> => {
    if (enabled) {
        const track = trackOverride ?? applicationState.activeTrack
        if (track != null) {
            const ownerId = track.id.split('_')[0]
            const audioId = track.id.split('_')[1]
            await vkApiClient.setBroadcast(ownerId, audioId)
        }
    } else {
        await vkApiClient.setBroadcast()
    }
}
