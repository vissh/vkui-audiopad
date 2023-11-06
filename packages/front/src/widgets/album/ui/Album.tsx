import { Image, Separator } from "@vkontakte/vkui";
import { AlbumCell } from "entities/album";
import { useSetPlaylist } from "entities/navigation";
import { FollowIcon } from "features/follow-album/ui/FollowIcon";
import { playOrPause } from "features/play-or-pause";
import { PlayPauseIcon } from "features/play-or-pause-album";
import { FC } from "react";
import { fetchPlaylist } from "shared/api";
import { TAlbum } from "shared/types";
import "./Album.css";

type AlbumProps = {
    userId: string;
    album: TAlbum;
};

export const Album: FC<AlbumProps> = ({ userId, album }) => {
    const setPlaylist = useSetPlaylist();

    return (
        <AlbumCell
            album={album}
            overlay={
                <Image.Overlay
                    theme="dark"
                    visibility="on-hover"
                >
                    <>
                        <FollowIcon album={album} />
                        <Separator />
                        <PlayPauseIcon
                            album={album}
                            onPlayNewAlbum={async () => {
                                const playlistFetchResult = await fetchPlaylist({ fromId: userId, playlist: album });
                                playOrPause("normal", 0, playlistFetchResult.playlist);
                            }}
                        />
                    </>
                </Image.Overlay>
            }
            onClick={() => setPlaylist(userId, album)}
        />
    );
};
