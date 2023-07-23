import { baseEnums } from "@vk-audiopad/common";
import { Search } from "@vkontakte/vkui";
import { useAtom } from "shared/lib/atom";
import { FC, useEffect, useState } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventSearchTrack } from "shared/lib/analytics";
import { useDebounce } from "shared/lib/hooks";

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
        <Search
            value={value}
            onChange={onChange}
        />
    );
};
