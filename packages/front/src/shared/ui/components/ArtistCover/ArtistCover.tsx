import { Div, Gradient, Title } from "@vkontakte/vkui";
import { FC } from "react";

type ArtistCoverProps = {
    title: string;
    backgroundImage: string;
};

export const ArtistCover: FC<ArtistCoverProps> = ({ title, backgroundImage }) => {
    return (
        <Gradient
            style={{
                backgroundImage: !!backgroundImage
                    ? "linear-gradient(to bottom,var(--vkui--gradient_black))," + backgroundImage
                    : "",
                minHeight: 194,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                marginLeft: "-8px",
                marginRight: "-8px",
            }}
        >
            <Div
                style={{
                    padding: "16px 20px",
                    boxSizing: "border-box",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    display: "flex",
                    zIndex: 3,
                    position: "relative",
                    minHeight: 194,
                }}
            >
                <Title
                    style={{
                        marginBottom: 8,
                        marginTop: 20,
                        maxHeight: "72px",
                        fontSize: "32px",
                        lineHeight: "36px",
                        color: "white",
                    }}
                    level="1"
                    weight="1"
                >
                    {title}
                </Title>
            </Div>
        </Gradient>
    );
};
