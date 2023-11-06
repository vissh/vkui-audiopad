import { baseTypes } from "@vk-audiopad/common";
import { Icon20Cancel, Icon20Check, Icon20ListPenOutline } from "@vkontakte/icons";
import { Button, Group, Header, List } from "@vkontakte/vkui";
import { FC, MouseEventHandler } from "react";
import { EditableTrack, Track } from "widgets/track";

type EditableTrackListProps = {
    playlist: baseTypes.TTitlePlaylist;
    editMode: boolean;
    onEdit: MouseEventHandler;
    onAccept: MouseEventHandler;
    onCancel: MouseEventHandler;
    onDragFinish: ({ from, to }: { from: number; to: number }) => void;
    onRemove: (index: number) => void;
};

export const EditableTrackList: FC<EditableTrackListProps> = ({
    playlist,
    editMode,
    onEdit,
    onAccept,
    onCancel,
    onDragFinish,
    onRemove,
}) => {
    return (
        <Group
            mode="plain"
            header={
                <Header
                    aside={
                        editMode ? (
                            <>
                                <Button
                                    key="acceptButton"
                                    mode="tertiary"
                                    before={<Icon20Check />}
                                    style={{ marginBottom: "0px" }}
                                    onClick={onAccept}
                                >
                                    Применить
                                </Button>
                                <Button
                                    key="cancelButton"
                                    mode="tertiary"
                                    appearance="negative"
                                    before={<Icon20Cancel />}
                                    style={{ marginBottom: "0px" }}
                                    onClick={onCancel}
                                >
                                    Отмена
                                </Button>
                            </>
                        ) : (
                            <Button
                                key="editButton"
                                mode="tertiary"
                                before={<Icon20ListPenOutline />}
                                style={{ marginBottom: "0px" }}
                                onClick={onEdit}
                            >
                                Режим редактирования
                            </Button>
                        )
                    }
                >
                    {playlist.title}
                </Header>
            }
        >
            <List>
                {playlist.tracks.map((track, index) => (
                    <>
                        {editMode ? (
                            <EditableTrack
                                key={track.id}
                                track={track}
                                trackIndex={index}
                                onDragFinish={onDragFinish}
                                onRemove={onRemove}
                            />
                        ) : (
                            <Track
                                key={track.id}
                                playlist={playlist}
                                track={track}
                                trackIndex={index}
                            />
                        )}
                    </>
                ))}
            </List>
        </Group>
    );
};
