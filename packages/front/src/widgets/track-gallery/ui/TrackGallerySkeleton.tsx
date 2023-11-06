import { useAppearance } from "@vkontakte/vkui";
import { FC } from "react";
import ContentLoader from "react-content-loader";

export const TrackGallerySkeleton: FC = () => {
    const appearance = useAppearance();

    const xOffset = 16;

    return (
        <ContentLoader
            speed={2}
            width={764}
            height={218}
            viewBox="0 0 764 218"
            backgroundColor={appearance === "light" ? "#F0F2F5" : "#292929"}
            foregroundColor={appearance === "light" ? "#E7E8EC" : "#333333"}
            title=""
        >
            <rect
                x={xOffset}
                y={16}
                rx="4"
                ry="4"
                width="80"
                height="16"
            />
            <rect
                x={646 + xOffset}
                y={16}
                rx="4"
                ry="4"
                width="80"
                height="16"
            />

            {[...Array(3).keys()].map((lineNumber) => {
                const startY = 44;
                const offsetY = startY + lineNumber * 58;
                const offsetX = 354;

                return (
                    <>
                        <rect
                            x={xOffset}
                            y={6 + offsetY}
                            rx="8"
                            ry="8"
                            width="48"
                            height="48"
                        />
                        <rect
                            x={56 + xOffset}
                            y={6 + offsetY}
                            rx="4"
                            ry="4"
                            width="110"
                            height="16"
                        />
                        <rect
                            x={56 + xOffset}
                            y={28 + offsetY}
                            rx="4"
                            ry="4"
                            width="80"
                            height="16"
                        />
                        <rect
                            x={280 + xOffset}
                            y={18 + offsetY}
                            rx="4"
                            ry="4"
                            width="52"
                            height="16"
                        />

                        <rect
                            x={0 + offsetX + xOffset}
                            y={6 + offsetY}
                            rx="8"
                            ry="8"
                            width="48"
                            height="48"
                        />
                        <rect
                            x={56 + offsetX + xOffset}
                            y={6 + offsetY}
                            rx="4"
                            ry="4"
                            width="110"
                            height="16"
                        />
                        <rect
                            x={56 + offsetX + xOffset}
                            y={28 + offsetY}
                            rx="4"
                            ry="4"
                            width="80"
                            height="16"
                        />
                        <rect
                            x={280 + offsetX + xOffset}
                            y={18 + offsetY}
                            rx="4"
                            ry="4"
                            width="52"
                            height="16"
                        />

                        <rect
                            x={0 + offsetX * 2 + xOffset}
                            y={6 + offsetY}
                            rx="8"
                            ry="8"
                            width="48"
                            height="48"
                        />
                    </>
                );
            })}
        </ContentLoader>
    );
};
