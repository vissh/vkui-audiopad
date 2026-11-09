import { commonTypes } from '@vk-audiopad/common'
import { Icon20Pause, Icon20Play } from '@vkontakte/icons'
import { Snackbar, Tappable } from '@vkontakte/vkui'
import { usePlaybackSelection, usePlaybackRequested } from '@/entities/active-track'
import { rememberMix } from '@/entities/vk-mix'
import { showNotification } from '@/shared/model'
import { type CatalogLinkItem } from '@/shared/types'
import { usePlaylistSelection } from '../model/selection'

export const PlayMixButton = ({ userId, item }: { userId: string, item: CatalogLinkItem }) => {
  const current = usePlaybackSelection()
  const requested = usePlaybackRequested()
  const active = current?.isVkMix === true && current.mixId === item.mixId && (current.mixOptions ?? '') === (item.mixOptions ?? '') && (current.mixEntityId ?? '') === (item.mixEntityId ?? '')
  const play = usePlaylistSelection(item.id, userId, active, async () => ({
    id: `mix-${item.id}`,
    ownerId: userId,
    blockId: '',
    title: item.title,
    tracks: [],
    isRadio: false,
    isVkMix: true,
    mixId: item.mixId,
    mixOptions: item.mixOptions,
    mixEntityId: item.mixEntityId,
    accessHash: '',
    nextOffset: '',
    hasMore: false,
    followHash: '',
    isFollowed: false
  } satisfies commonTypes.Playlist))
  const activate = (): void => {
    void play().then(() => {
      if (item.mixId === 'common') rememberMix(userId, item.mixOptions ?? '', item.title)
    }).catch(() => {
      showNotification(<Snackbar onClosed={() => { showNotification(null) }}>Не удалось запустить Микс. Повторите попытку</Snackbar>)
    })
  }
  return (
    <Tappable
      Component='button'
      type='button'
      className='vkap_catalog_tile_open vkap_catalog_mix_action'
      aria-pressed={active && requested}
      aria-label={`${active && requested ? 'Приостановить' : 'Воспроизвести'}: ${item.title}${item.subtitle.length > 0 ? ` ${item.subtitle}` : ''}`}
      onClick={activate}
    >
      <span className='vkap_catalog_tile_label'><span>{item.title}</span>{item.subtitle.length > 0 && <small>{item.subtitle}</small>}</span>
      <span className='vkap_catalog_mix_icon' aria-hidden='true'>{active && requested ? <Icon20Pause /> : <Icon20Play />}</span>
    </Tappable>
  )
}
