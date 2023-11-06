import { Icon36PlaylistOutline } from "@vkontakte/icons";
import { HorizontalCell, Image } from "@vkontakte/vkui";
import { FC } from "react";
import { TAlbum } from "shared/types";
import "./AlbumCell.css";

type AlbumCellProps = {
    album: TAlbum;
    overlay?: React.ReactNode;
    onClick: () => void;
};

export const AlbumCell: FC<AlbumCellProps> = ({ album, overlay, onClick }) => {
    return (
        <HorizontalCell
            size="l"
            header={<span className="vkap_subtitle">{album.title}</span>}
            subtitle={<span className="vkap_subtitle">{album.authorName}</span>}
            extraSubtitle={!!album.infoLine && <span className="vkap_subtitle">{album.infoLine}</span>}
            onClick={onClick}
        >
            {/* TODO: GridAvatar или что-то подобное. Для ручных плейлистов бывает несколько обложек. */}
            {album.coverUrl ? (
                <Image
                    src={album.coverUrl}
                    loading={"lazy"}
                    size={136}
                >
                    {overlay}
                </Image>
            ) : (
                <Image size={136}>
                    <Icon36PlaylistOutline />
                </Image>
            )}
        </HorizontalCell>
    );
};
