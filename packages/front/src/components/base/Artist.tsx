import { storage, types } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { useSearchTracksActions } from "../../hooks/useActions";

type Props = {
    value: string;
};

export const Artist: FC<Props> = ({ value }) => {
    const { setValue } = useSearchTracksActions();

    const truncateTextStyle: CSSProperties = {
        overflow: "hidden",
        textOverflow: "ellipsis",
    };

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
            style={{ color: "var(--vkui--color_text_secondary)", cursor: "pointer", ...truncateTextStyle }}
        >
            {value}
        </Subhead>
    );
};
