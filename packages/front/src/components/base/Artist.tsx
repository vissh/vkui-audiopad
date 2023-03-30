import { storage, types } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { FC } from "react";
import "./Artist.css";

import { useSearchTracksActions } from "../../hooks/useActions";

type Props = {
    value: string;
};

export const Artist: FC<Props> = ({ value }) => {
    const { setValue } = useSearchTracksActions();

    return (
        <Subhead
            onClick={async e => {
                e.stopPropagation();
                setValue(value);
                await storage.set({
                    selectedTab: {
                        tab: types.ContentTab.SEARCH,
                        value: value as string,
                    }
                });
            }}
            className="artist"
        >
            {value}
        </Subhead>
    );
};
