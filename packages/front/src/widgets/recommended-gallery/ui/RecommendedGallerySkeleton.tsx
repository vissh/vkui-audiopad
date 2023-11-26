import { useAppearance } from '@vkontakte/vkui'
import { type FC } from 'react'
import ContentLoader from 'react-content-loader'

export const RecommendedGallerySkeleton: FC = () => {
  const appearance = useAppearance()

  const xOffset = 10

  return (
    <ContentLoader
      speed={2}
      width={764}
      height={264}
      viewBox='0 0 764 264'
      backgroundColor={appearance === 'light' ? '#F0F2F5' : '#292929'}
      foregroundColor={appearance === 'light' ? '#E7E8EC' : '#333333'}
      title=''
    >
      <rect
        x={6 + xOffset}
        y={16}
        rx='4'
        ry='4'
        width='130'
        height='16'
      />

      {[...Array(5).keys()].map((columnNumber) => {
        const offsetX = xOffset + columnNumber * 174
        return (
          <rect
            key={columnNumber}
            x={offsetX}
            y='44'
            rx='8'
            ry='8'
            width='165'
            height='200'
          />
        )
      })}
    </ContentLoader>
  )
}
