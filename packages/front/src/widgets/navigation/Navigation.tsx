import { tabTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { useAtomValue } from "shared/lib/atom";
import { ContentTabs } from "./ContentTabs";
import { History } from "./History";
import { SearchInput } from "./SearchInput";

export const Navigation: FC = () => {
    const selectedTab = useAtomValue(selectedTabAtom);

    return (
        <>
            {(tabTypes.isTabWithHistory(selectedTab) && <History selectedTab={selectedTab} />) || <ContentTabs />}
            <SearchInput />
        </>
    );
};
