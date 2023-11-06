import { Card, Text, Title } from "@vkontakte/vkui";
import { FC } from "react";
import { TAlbum } from "shared/types";

type CardCellProps = {
    album: TAlbum;
    onClick: () => void;
};

export const CardCell: FC<CardCellProps> = ({ album, onClick }) => {
    return (
        <Card
            style={{
                backgroundImage: "url(" + album.coverUrl + ")",
                backgroundSize: "165px 200px",
                width: "165px",
                height: "200px",
                cursor: "pointer",
            }}
            onClick={onClick}
        >
            <Title
                style={{
                    marginBottom: 12,
                    marginTop: 20,
                    textAlign: "center",
                    color: "white",
                }}
                level="1"
                weight="1"
            >
                {album.title}
            </Title>
            <Text
                style={{
                    marginBottom: 48,
                    textAlign: "center",
                    color: "white",
                }}
            >
                {album.authorLine}
            </Text>
        </Card>
    );
};
