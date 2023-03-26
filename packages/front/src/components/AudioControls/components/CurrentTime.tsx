import { utils } from "@vk-audiopad/common";
import { Button } from "@vkontakte/vkui";
import { FC } from "react";

import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Duration } from "../../base/Duration";

export const CurrentTime: FC = () => {
    const { duration, currentTime } = useTypedSelector(state => state.application);

    return (
        <Button hasHover={false} mode="link" stretched style={{ width: "42px" }}>
            <Duration value={duration ? "-" + utils.toHHMMSS(duration - currentTime) : ""} />
        </Button>

    );
};
