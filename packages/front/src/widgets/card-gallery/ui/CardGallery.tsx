import { CardScroll } from "@vkontakte/vkui";
import { CardCell } from "entities/card";
import { useSetPlaylist } from "entities/navigation";
import { FC } from "react";
import { TAlbum } from "shared/types";

type CardGalleryProps = {
    userId: string;
    albums: TAlbum[];
};

export const CardGallery: FC<CardGalleryProps> = ({ userId, albums }) => {
    const setPlaylist = useSetPlaylist();

    return (
        <CardScroll size="s">
            {albums.map((album) => (
                <CardCell
                    album={album}
                    onClick={() => setPlaylist(userId, album)}
                />
            ))}
        </CardScroll>
    );
};
