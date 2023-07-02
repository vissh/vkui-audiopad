import { useAppearance } from '@vkontakte/vkui';
import { FC } from 'react';
import ContentLoader from 'react-content-loader';

export const SkeletonCoverPlaylists: FC = () => {
    const appearance = useAppearance();

    const xOffset = 16;

    return (
        <ContentLoader
            speed={2}
            width={764}
            height={582}
            viewBox="0 0 764 582"
            backgroundColor={appearance === "light" ? "#F0F2F5" : "#292929"}
            foregroundColor={appearance === "light" ? "#E7E8EC" : "#333333"}
            title=""
        >
            {/* <rect x={xOffset} y={16} rx="4" ry="4" width="80" height="16" /> */}

            {[...Array(3).keys()].map(lineNumber => {
                const offsetY = lineNumber * 192;

                return [...Array(5).keys()].map(columnNUmber => {
                    const offsetX = xOffset + columnNUmber * 146;
                    return (
                        <>
                            <rect x={offsetX} y={6 + offsetY} rx="8" ry="8" width="136" height="136" />
                            <rect x={offsetX} y={146 + offsetY} rx="4" ry="4" width="110" height="16" />
                            <rect x={offsetX} y={168 + offsetY} rx="4" ry="4" width="80" height="16" />
                        </>
                    )
                })
            })}

        </ContentLoader>
    );
};
