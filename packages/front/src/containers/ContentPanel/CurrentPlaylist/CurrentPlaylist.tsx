import { baseTypes } from "@vk-audiopad/common";
import { FC, useEffect, useState } from "react";
import { InfinityContent } from "../../../components/InfiniteContent";
import { useAtomValue } from "../../../core/atom";
import { currentPlaylistAtom } from "../../../core/atoms/storage";
import { EditableTitleTracks } from "./EditableTitleTracks";
import { applyEditedCurrentPlaylist, useLoadMorePlaylistTracksMutation } from "./hooks";

export const CurrentPlaylist: FC = () => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);

    const [editMode, setEditMode] = useState(false);
    const [playlist, setPlaylist] = useState<baseTypes.TTitlePlaylist | null>(null);
    const [actions, setActions] = useState<Array<Array<any>>>([]);

    useEffect(() => {
        setPlaylist(currentPlaylist);
    }, [currentPlaylist]);

    const loadMoreMutation = useLoadMorePlaylistTracksMutation(playlist);

    const onEdit = () => {
        if (currentPlaylist) {
            const playlist = { ...currentPlaylist }
            playlist.tracks = [...currentPlaylist.tracks]
            setPlaylist(playlist);
            setEditMode(true);
        }
    };

    const onAccept = () => {
        if (playlist && currentPlaylist) {
            applyEditedCurrentPlaylist(playlist, currentPlaylist, actions);
            setEditMode(false);
            setPlaylist(null);
            setActions([]);
        }
    };

    const onCancel = () => {
        setEditMode(false);
        setPlaylist(currentPlaylist);
    };

    const onDragFinish = async ({ from, to }: { from: number, to: number }) => {
        if (playlist) {
            const tracks = [...playlist.tracks];
            tracks.splice(from, 1);
            tracks.splice(to, 0, playlist.tracks[from]);
            playlist.tracks = tracks;
            setPlaylist({ ...playlist });
            setActions([...actions, ["move", from, to]]);
        }
    };

    const onRemove = (index: number) => {
        if (playlist) {
            playlist.tracks.splice(index, 1);
            setPlaylist({ ...playlist });
            setActions([...actions, ["remove", index]]);
        }
    };

    return (
        <InfinityContent
            hasMore={!!playlist?.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={playlist}
        >
            {playlist && playlist.tracks.length > 0 && (
                <>
                    {<EditableTitleTracks
                        playlist={playlist}
                        editMode={editMode}
                        onEdit={onEdit}
                        onAccept={onAccept}
                        onCancel={onCancel}
                        onDragFinish={onDragFinish}
                        onRemove={onRemove}
                    />}
                </>
            )}
        </InfinityContent>
    );
};
