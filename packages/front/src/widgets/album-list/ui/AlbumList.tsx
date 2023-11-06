import { utils } from "@vk-audiopad/common";
import { HorizontalScroll, List } from "@vkontakte/vkui";
import { FC } from "react";
import { TAlbum } from "shared/types";
import { Album } from "widgets/album";

type AlbumListProps = {
    userId: string;
    albums: TAlbum[];
};

export const AlbumList: FC<AlbumListProps> = ({ userId, albums }) => {
    const batchedAlbums: TAlbum[][] = Array.from(utils.chunked(albums, 5));

    return (
        <List>
            {batchedAlbums.map((batch) => (
                <HorizontalScroll>
                    <div style={{ display: "flex" }}>
                        {batch.map((album) => (
                            <Album
                                userId={userId}
                                album={album}
                            />
                        ))}
                    </div>
                </HorizontalScroll>
            ))}
        </List>
    );
};
