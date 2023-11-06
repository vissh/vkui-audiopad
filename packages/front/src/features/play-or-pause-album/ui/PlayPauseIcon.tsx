import { Icon36Pause, Icon36Play } from "@vkontakte/icons";
import { FC } from "react";
import { useAtom, useAtomValue } from "shared/lib/atom";
import { currentPlaylistAtom, playedAtom } from "shared/model/storage-atoms";
import { TAlbum } from "shared/types";

type PlayPauseIconProps = {
    album: TAlbum;
    onPlayNewAlbum: () => void;
};

export const PlayPauseIcon: FC<PlayPauseIconProps> = ({ album, onPlayNewAlbum }) => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const [played, setPlayed] = useAtom(playedAtom);

    const resumePauseAlbum = (e: any) => {
        e.stopPropagation();
        setPlayed(!played);
    };

    const playNewAlbum = (e: any) => {
        e.stopPropagation();
        onPlayNewAlbum();
    };

    return (
        <>
            {currentPlaylist && currentPlaylist.id === album.id ? (
                played ? (
                    <Icon36Pause
                        className="vkap_cover_pl_act_btn"
                        onClick={resumePauseAlbum}
                    />
                ) : (
                    <Icon36Play
                        className="vkap_cover_pl_act_btn"
                        onClick={resumePauseAlbum}
                    />
                )
            ) : (
                <Icon36Play
                    className="vkap_cover_pl_act_btn"
                    onClick={playNewAlbum}
                />
            )}
        </>
    );
};
