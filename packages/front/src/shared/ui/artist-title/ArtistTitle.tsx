import { baseTypes } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { FC } from "react";
import "./ArtistTitle.css";

type ArtistTitleProps = {
    track: baseTypes.TTrackItem;
    onSearch: (artist: string) => void;
    onArtist: (artist: baseTypes.TArtist) => void;
};

export const ArtistTitle: FC<ArtistTitleProps> = ({ track, onSearch, onArtist }) => {
    const searchClick = (artist: string) => {
        return (e: any) => {
            e.stopPropagation();
            onSearch(artist);
        };
    };

    const openArtistPage = (artist: baseTypes.TArtist) => {
        return (e: any) => {
            e.stopPropagation();
            onArtist(artist);
        };
    };

    return (
        <Subhead className="vkap_artists">
            {track.mainArtists.length > 0 ? (
                <>
                    {groupArtists(track.mainArtists, openArtistPage)}
                    {track.featArtists.length > 0 && (
                        <>
                            &nbsp;feat.&nbsp;
                            {groupArtists(track.featArtists, openArtistPage)}
                        </>
                    )}
                </>
            ) : (
                <span
                    onClick={searchClick(track.artist)}
                    className="vkap_artist"
                >
                    {track.artist}
                </span>
            )}
        </Subhead>
    );
};

const groupArtists = (artists: Array<baseTypes.TArtist>, onClick: (artist: baseTypes.TArtist) => (e: any) => void) => {
    return artists.map((artist, index, arr) => (
        <>
            <span
                onClick={onClick(artist)}
                className="vkap_artist"
            >
                {artist.name}
            </span>
            {index !== arr.length - 1 ? ", " : ""}
        </>
    ));
};
