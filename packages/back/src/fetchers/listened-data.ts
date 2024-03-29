import { vkClient } from '@vk-audiopad/common'
import { type TListenedData } from '../types'

export const fetchListenedData = async (args: TListenedData): Promise<void> => {
  await vkClient.request('https://vk.com/al_audio.php?act=listened_data', {
    act: 'listened_data',
    al: '1',
    audio_id: args.track.id,
    end_stream_reason: args.endStreamReason,
    hash: args.track.urlHash,
    impl: 'html5',
    listened: args.listened.toString(),
    loc: 'audios' + args.userId,
    state: 'app',
    v: '5'
  })
}
