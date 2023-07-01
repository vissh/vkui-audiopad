import { baseEnums } from "@vk-audiopad/common";
import { Subhead } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms";
import { sendEventControlSearchArtist, sendEventSearchArtist } from "../core/top";
import "./Artist.css";

type Props = {
    value: string;
    context?: "controls";
};

export const Artist: FC<Props> = ({ value, context }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onClick = (e: any) => {
        e.stopPropagation();
        setSelectedTab({
            tab: baseEnums.EContentTab.SEARCH,
            value: value as string,
        });

        context === undefined
            ? sendEventSearchArtist(selectedTab.tab)
            : sendEventControlSearchArtist();
    };

    return (
        <Subhead onClick={onClick} className="artist">
            {value}
        </Subhead>
    );
};
