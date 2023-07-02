import { useAppearance } from '@vkontakte/vkui';
import { FC } from 'react';
import ContentLoader from 'react-content-loader';

export const SkeletonHorizontalCoverPlaylists: FC = () => {
    const appearance = useAppearance();

    const xOffset = 16;

    return (
        <ContentLoader
            speed={2}
            width={764}
            height={238}
            viewBox="0 0 764 238"
            backgroundColor={appearance === "light" ? "#F0F2F5" : "#292929"}
            foregroundColor={appearance === "light" ? "#E7E8EC" : "#333333"}
            title=""
        >
            <rect x={xOffset} y={16} rx="4" ry="4" width="80" height="16" />
            <rect x={670 + xOffset} y={16} rx="4" ry="4" width="80" height="16" />

            {[...Array(6).keys()].map(columnNumber => {
                const offsetX = xOffset + columnNumber * 146;
                return (
                    <>
                        <rect x={offsetX} y="44" rx="8" ry="8" width="136" height="136" />
                        <rect x={offsetX} y="186" rx="4" ry="4" width="110" height="16" />
                        <rect x={offsetX} y="206" rx="4" ry="4" width="80" height="16" />
                    </>
                )
            })}

        </ContentLoader>
    );
};
