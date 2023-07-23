import { baseTypes } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { FC } from "react";
import "./ArtistTitle.css";

type ArtistTitleProps = {
    track: baseTypes.TTrackItem;
    onClick: (artist: string) => void;
};

export const ArtistTitle: FC<ArtistTitleProps> = ({ track, onClick }) => {
    const stopPropagationClick = (artist: string) => {
        return (e: any) => {
            e.stopPropagation();
            onClick(artist);
        };
    };

    return (
        <Subhead className="artists">
            {track.mainArtists.length > 0 ? (
                <>
                    {groupArtists(track.mainArtists, stopPropagationClick)}
                    {track.featArtists.length > 0 && (
                        <>
                            &nbsp;feat.&nbsp;
                            {groupArtists(track.featArtists, stopPropagationClick)}
                        </>
                    )}
                </>
            ) : (
                <span
                    onClick={stopPropagationClick(track.artist)}
                    className="artist"
                >
                    {track.artist}
                </span>
            )}
        </Subhead>
    );
};

const groupArtists = (artists: Array<baseTypes.TArtist>, onClick: (value: string) => (e: any) => void) => {
    return artists.map((x, index, arr) => (
        <>
            <span
                onClick={onClick(x.name)}
                className="artist"
            >
                {x.name}
            </span>
            {index !== arr.length - 1 ? ", " : ""}
        </>
    ));
};
