import { Avatar, RichCell, Slider } from "@vkontakte/vkui";
import { FC, useState } from "react";

export const AudioControls: FC = () => {
    const [position, setPosition] = useState(98.9);

    return (
        <RichCell
            text={
                <Slider
                    hidden={false}
                    value={Number(position)}
                    onChange={setPosition}
                />
            }
            before={<Avatar
                src="https://filin.mail.ru/pic?d=hff4Gs-XCsLvvB_MigW5tzPGr0ZocmMYYhQ-HhKY-8ye9zDDUUSIDmqxP2l6Ds4ZWW5zQQ~~&width=180&height=180" />}
        >
            azazaz
        </RichCell>
    );
};
