import { Icon20SkipBack, Icon20SkipForward, Icon28PauseCircle, Icon28PlayCircle } from "@vkontakte/icons";
import { Avatar, IconButton, PanelHeader, SimpleCell } from "@vkontakte/vkui";
import React, { FC } from "react";

export const AudioControls: FC = () => {
    const paused = true;

    return (
        <PanelHeader
            before={
                <React.Fragment>
                    <IconButton hasHover={false}>
                        {paused
                            ? <Icon28PlayCircle />
                            : <Icon28PauseCircle />
                        }
                    </IconButton>
                    <IconButton hasHover={false}>
                        <Icon20SkipBack />
                    </IconButton>
                    <IconButton hasHover={false}>
                        <Icon20SkipForward />
                    </IconButton>
                </React.Fragment>
            }
        >
            <SimpleCell
                hasHover={false}
                hasActive={false}
                before={
                    <Avatar
                        mode="image"
                        src="https://filin.mail.ru/pic?d=hff4Gs-XCsLvvB_MigW5tzPGr0ZocmMYYhQ-HhKY-8ye9zDDUUSIDmqxP2l6Ds4ZWW5zQQ~~&width=180&height=180" />
                }
                after={"4:20"}
                subtitle={"FEVER 333"}
            >
                PTSD
            </SimpleCell>
        </PanelHeader>
    );
};

//     const [position, setPosition] = useState(98.9);
//     <Slider
//     hidden={false}
//     value={Number(position)}
//     onChange={setPosition}
// />
