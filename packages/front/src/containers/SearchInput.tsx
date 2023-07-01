import { baseEnums } from "@vk-audiopad/common";
import { Search } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { useAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms";
import { useDebounce } from "../core/hooks/debounce";
import { sendEventSearchTrack } from "../core/top";

export const SearchInput: FC = () => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);
    const [value, setValue] = useState("");

    const setSearchValueToStorage = useDebounce((value: string) => {
        if (value) {
            setSelectedTab({
                tab: baseEnums.EContentTab.SEARCH,
                value: value,
            });
            sendEventSearchTrack(selectedTab.tab);
        }
    }, 600);

    const onChange = (e: any) => {
        setValue(e.target.value);
        setSearchValueToStorage(e.target.value);
    };

    useEffect(() => {
        setValue(selectedTab.tab === baseEnums.EContentTab.SEARCH ? selectedTab.value : "");
    }, [selectedTab]);

    return (
        <Search value={value} onChange={onChange} />
    );
};
