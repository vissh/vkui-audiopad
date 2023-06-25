import { TCoverPlaylist } from "../../../core/types/playlists";

export type TFetchSearchArgs = {
    ownerId: string;
    value: string;
};

export type BlockCoverPlaylist = {
    blockId: string;
    title: string;
    playlists: TCoverPlaylist[];
};
