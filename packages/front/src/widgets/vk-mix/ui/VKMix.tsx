import { Div, Flex, Group, Headline, Spacing, Title } from '@vkontakte/vkui'
import { type FC } from 'react'
import { LoadingPlaceholder as Skeleton } from '@/shared/ui/loading-placeholder'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { VKMixBalls } from './VKMixBalls'
import { VKMixButton } from './VKMixButton'
import { VKMixSettings } from './VKMixSettings'

const WIDTH = 720
const HEIGHT = 242

interface VKMixProps {
  isPending: boolean
  active?: boolean
  userId: string
}

export const VKMix: FC<VKMixProps> = ({ isPending, userId, active = true }) => {
  return (
    <SkeletonWrapper
      isPending={isPending}
      skeleton={<VKMixSkeleton width={WIDTH} height={HEIGHT} />}
    >
      <Group mode='plain' style={{ textAlign: 'center', paddingBottom: 'unset' }}>
        <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
          <VKMixBalls width={WIDTH} height={HEIGHT} active={active} />

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '100%'
          }}
          >
            <Flex align='center' justify='center' style={{ width: '100%' }}>
              <Div>
                <VKMixButton userId={userId} />
              </Div>
            </Flex>
            <Title level='2' weight='2'>
              Слушать VK Микс
            </Title>
            <Spacing />
            <Headline
              level='1'
              weight='3'
              style={{ color: 'var(--vkui--color_text_secondary)' }}
            >
              Музыкальные рекомендации для вас
            </Headline>
            <VKMixSettings key={userId} userId={userId} />
          </div>
        </div>
      </Group>
    </SkeletonWrapper>

  )
}

interface VKMixSkeletonProps {
  width: number
  height: number
}

const VKMixSkeleton: FC<VKMixSkeletonProps> = ({ width, height }) => {
  return (
    <Group mode='plain' style={{ textAlign: 'center', paddingBottom: 'unset' }}>
      <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <canvas
          width={width}
          height={height}
          style={{ display: 'inline-block', maxWidth: '100%' }}
        />

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%'
        }}
        >
          <Flex align='center' justify='center' style={{ width: '100%' }}>
            <Div>
              <Skeleton width={36} height={36} borderRadius='50%' />
            </Div>
          </Flex>
          <Skeleton width={180} height={18} />
          <Spacing />
          <Skeleton width={260} height={12} />
          <Spacing size={16} />
          <Skeleton width={120} height={32} />
        </div>
      </div>
    </Group>
  )
}
