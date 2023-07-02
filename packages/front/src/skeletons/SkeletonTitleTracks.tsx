import { useAppearance } from '@vkontakte/vkui';
import { FC } from 'react';
import ContentLoader from 'react-content-loader';

export const SkeletonTitleTracks: FC = () => {
    const appearance = useAppearance();

    const xOffset = 16;

    return (
        <ContentLoader
            speed={2}
            width={764}
            height={508}
            viewBox="0 0 764 508"
            backgroundColor={appearance === "light" ? "#F0F2F5" : "#292929"}
            foregroundColor={appearance === "light" ? "#E7E8EC" : "#333333"}
            title=""
        >
            <rect x={xOffset} y={16} rx="4" ry="4" width="80" height="16" />

            {[...Array(10).keys()].map(lineNumber => {
                const startY = 44;
                const offsetY = startY + lineNumber * 58;

                return (
                    <>
                        <rect x={xOffset} y={6 + offsetY} rx="8" ry="8" width="48" height="48" />
                        <rect x={56 + xOffset} y={6 + offsetY} rx="4" ry="4" width="110" height="16" />
                        <rect x={56 + xOffset} y={28 + offsetY} rx="4" ry="4" width="80" height="16" />
                        <rect x={680 + xOffset} y={18 + offsetY} rx="4" ry="4" width="32" height="16" />
                    </>
                );
            })}

        </ContentLoader>
    );
};
