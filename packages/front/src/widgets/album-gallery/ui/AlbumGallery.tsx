import { Group, Header, HorizontalScroll, Link } from "@vkontakte/vkui";
import { useSetAlbums } from "entities/navigation/model/hooks";
import { FC } from "react";
import { TAlbum } from "shared/types";
import { Album } from "widgets/album";

type AlbumGalleryProps = {
    mode: "plain" | "card";
    userId: string;
    title: string;
    albums: TAlbum[];
    showAllLink: string;
};

export const AlbumGallery: FC<AlbumGalleryProps> = ({ mode, userId, title, albums, showAllLink }) => {
    const setAlbums = useSetAlbums();

    const onClick = () => setAlbums(title, showAllLink);

    return (
        <Group
            mode={mode}
            header={<Header aside={!!showAllLink && <Link onClick={onClick}>Показать все</Link>}>{title}</Header>}
        >
            <HorizontalScroll>
                <div style={{ display: "flex" }}>
                    {albums.map((album) => (
                        <Album
                            userId={userId}
                            album={album}
                        />
                    ))}
                </div>
            </HorizontalScroll>
        </Group>
    );
};
