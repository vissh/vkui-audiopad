import { useQuery } from '@tanstack/react-query'
import { commonTypes, vkApiClient } from '@vk-audiopad/common'
import { Icon24TextTtOutline } from '@vkontakte/icons'
import { Box, Button, ModalPage, ModalPageHeader, PanelHeaderClose, Placeholder, Separator, Spinner, Subhead, Text, Title } from '@vkontakte/vkui'
import { useId, useRef, useState, type FC } from 'react'
import { getText } from '@/shared/lib/cast-to-types'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import './LyricsButton.css'

export const LyricsButton: FC<{ track: commonTypes.TrackItem, userId: string }> = ({ track, userId }) => {
  const [open, setOpen] = useState(false)
  const [tooltipShown, setTooltipShown] = useState(false)
  const suppressRestoredFocus = useRef(false)
  const titleId = useId()
  const hasLyrics = (track.flags & commonTypes.TrackFlagBit.HAS_LYRICS) !== 0
  const close = () => {
    suppressRestoredFocus.current = true
    setTooltipShown(false)
    setOpen(false)
  }

  if (!hasLyrics) return null

  return (
    <>
      <TooltipIconButton
        text='Показать текст'
        icon={Icon24TextTtOutline}
        padding
        tooltipShown={!open && tooltipShown}
        onTooltipShownChange={(shown, reason) => {
          if (shown && reason === 'focus' && suppressRestoredFocus.current) {
            suppressRestoredFocus.current = false
            return
          }
          setTooltipShown(shown && !open)
        }}
        onClick={() => {
          setTooltipShown(false)
          setOpen(true)
        }}
      />
      <ModalPage
        open={open}
        onClose={close}
        size='m'
        height='min(560px, calc(100vh - 32px))'
        settlingHeight={100}
        hideCloseButton
        aria-labelledby={titleId}
        header={<ModalPageHeader before={<PanelHeaderClose label='Закрыть текст' onClick={close} />}>Текст песни</ModalPageHeader>}
      >
        <Box className='vkap_lyrics_heading' padding='2xl'>
          <Title id={titleId} level='2' Component='h2'>{getText(track.title)}</Title>
          <Subhead className='vkap_lyrics_artist'>{getText(track.artist)}</Subhead>
        </Box>
        <Separator />
        {open && <LyricsContent track={track} userId={userId} />}
      </ModalPage>
    </>
  )
}

const LyricsContent: FC<{ track: commonTypes.TrackItem, userId: string }> = ({ track, userId }) => {
  const lyrics = useQuery({
    queryKey: ['audio-lyrics', userId, track.id],
    queryFn: async ({ signal }) => await vkApiClient.getAudioLyrics(track, signal),
    retry: false,
    networkMode: 'always',
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  if (lyrics.isPending || lyrics.isFetching) return <Placeholder><Spinner size='m' aria-label='Загрузка текста' /></Placeholder>
  if (lyrics.isError) return <Placeholder title='Не удалось загрузить текст' action={<Button onClick={() => { void lyrics.refetch() }}>Повторить</Button>}>Проверьте соединение и попробуйте ещё раз</Placeholder>
  if (lyrics.data == null) return <Placeholder title='Текст пока недоступен'>Возможно, он появится позже</Placeholder>
  return <Box padding='2xl'><Text Component='p' className='vkap_lyrics_text'>{lyrics.data}</Text></Box>
}
