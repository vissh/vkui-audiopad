import { tabTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { useAtomValue } from "shared/lib/atom";
import { ContentTabs } from "./ContentTabs";
import { History } from "./History";

type NavigationProps = {
    children: React.ReactNode;
};

export const Navigation: FC<NavigationProps> = ({ children }) => {
    const selectedTab = useAtomValue(selectedTabAtom);

    return (
        <>
            {(tabTypes.isTabWithHistory(selectedTab) && <History selectedTab={selectedTab} />) || <ContentTabs />}
            {children}
        </>
    );
};
