import { baseEnums } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms";
import "./Artist.css";

type Props = {
    value: string;
};

export const Artist: FC<Props> = ({ value }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    return (
        <Subhead
            onClick={e => {
                e.stopPropagation();
                setSelectedTab({
                    tab: baseEnums.EContentTab.SEARCH,
                    value: value as string,
                });
            }}
            className="artist"
        >
            {value}
        </Subhead>
    );
};
