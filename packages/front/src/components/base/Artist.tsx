import { storage, types } from "@vk-audiopad/common";
import { Link } from "@vkontakte/vkui";
import { FC } from "react";

import { useSearchTracksActions } from "../../hooks/useActions";

type Props = {
    value: string;
};

export const Artist: FC<Props> = ({ value }) => {
    const { setValue } = useSearchTracksActions();

    return (
        <Link
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
            style={{ color: "var(--vkui--color_text_secondary)" }}
        >
            {value}
        </Link>
    );
};
