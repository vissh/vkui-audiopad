import { baseTypes } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { useSetPlaylist } from "entities/navigation";
import { FC } from "react";

type ShowAllLinkProps = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const ShowAllLink: FC<ShowAllLinkProps> = ({ userId, playlist }) => {
    const setPlaylist = useSetPlaylist();

    const onClick = () => setPlaylist(userId, playlist);

    return (
        <Header aside={playlist.tracks.length > 6 && <Link onClick={onClick}>Показать все</Link>}>
            {playlist.title}
        </Header>
    );
};
