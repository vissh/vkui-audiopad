import { Div, Flex, Group, Headline, Skeleton, Spacing, Title } from '@vkontakte/vkui'
import { type FC } from 'react'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { VKMixBalls } from './VKMixBalls'
import { VKMixButton } from './VKMixButton'

const WIDTH = 720
const HEIGHT = 174

interface VKMixProps {
  isPending: boolean
}

export const VKMix: FC<VKMixProps> = ({ isPending }) => {
  return (
    <SkeletonWrapper
      isPending={isPending}
      skeleton={<VKMixSkeleton width={WIDTH} height={HEIGHT} />}
    >
      <Group mode='plain' style={{ textAlign: 'center', paddingBottom: 'unset' }}>
        <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
          <VKMixBalls width={WIDTH} height={HEIGHT} />

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '100%'
          }}>
            <Flex align="center" justify="center" style={{ width: '100%' }}>
              <Div>
                <VKMixButton />
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
          style={{ display: 'inline-block;' }}
        />

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%'
        }}>
          <Flex align="center" justify="center" style={{ width: '100%' }}>
            <Div>
              <Skeleton width={36} height={36} borderRadius="50%" />
            </Div>
          </Flex>
          <Skeleton width={180} height={18} />
          <Spacing />
          <Skeleton width={260} height={12} />
        </div>
      </div>
    </Group>
  )
}
