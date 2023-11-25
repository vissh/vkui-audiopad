import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { AlbumGallery } from '@/widgets/album-list'
import { Navigation } from '@/widgets/navigation'
import { RecommendedGallery } from '@/widgets/recommended-gallery'
import { TrackGallery } from '@/widgets/track-list'
import { Content } from '@/shared/ui/content'
import { useGeneralData } from '../model/hooks'

interface GeneralProps {
  userId: string
  active: boolean
}

export const General: FC<GeneralProps> = ({ userId, active }) => {
  const { data: fetchResult, isLoading, error } = useGeneralData(userId, active)

  return (
    <Content
      display={active}
      error={error}
    >
      <Group>
        <Navigation />

        <TrackGallery
          mode='plain'
          isLoading={isLoading}
          userId={userId}
          playlist={fetchResult?.playlist}
        />
      </Group>

      <RecommendedGallery
        isLoading={isLoading}
        title='Собрано алгоритмами'
        userId={userId}
        albums={fetchResult?.baseOnYourTastes}
      />

      <AlbumGallery
        mode='card'
        isLoading={isLoading}
        title='Собрано редакцией'
        userId={userId}
        albums={fetchResult?.vkMusic}
        showAllLink={`/audios${userId}?block=playlists&section=general`}
      />
    </Content>
  )
}
