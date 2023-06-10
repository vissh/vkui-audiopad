import { baseTypes } from "@vk-audiopad/common";
import { Icon20Cancel, Icon20Check, Icon20ListPenOutline } from "@vkontakte/icons";
import { Group, Header, Link, List } from "@vkontakte/vkui";
import { FC, MouseEventHandler } from "react";
import { Track } from "../../../components/Track";

type Props = {
    playlist: baseTypes.TTitlePlaylist;
    editMode: boolean;
    onEdit: MouseEventHandler;
    onAccept: MouseEventHandler;
    onCancel: MouseEventHandler;
    onDragFinish: ({ from, to }: { from: number, to: number }) => void;
    onRemove: (index: number) => void;
};

export const EditableTitleTracks: FC<Props> = ({ playlist, editMode, onEdit, onAccept, onCancel, onDragFinish, onRemove }) => {
    return (
        <Group
            mode="plain"
            header={
                <Header
                    mode="secondary"
                    aside={
                        editMode
                            ? <>
                                <Link onClick={onAccept} title="Применить"><Icon20Check /></Link>
                                <Link onClick={onCancel} title="Отмена"><Icon20Cancel /></Link>
                            </>
                            : <Link onClick={onEdit} title="Режим редактирования"><Icon20ListPenOutline /></Link>
                    }
                >
                    {playlist.title}
                </Header>
            }
        >
            <List>
                {playlist.tracks.map((track, index) =>
                    <Track
                        key={track.id}
                        playlist={playlist}
                        track={track}
                        trackIndex={index}
                        draggable={editMode}
                        onDragFinish={editMode ? onDragFinish : undefined}
                        onRemove={editMode ? onRemove : undefined}
                    />
                )}
            </List>
        </Group>
    );
};
