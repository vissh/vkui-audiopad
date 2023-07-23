import { TCoverPlaylist } from "shared/types";

export type TFetchSearchArgs = {
    ownerId: string;
    value: string;
};

export type BlockCoverPlaylist = {
    blockId: string;
    title: string;
    playlists: TCoverPlaylist[];
};
