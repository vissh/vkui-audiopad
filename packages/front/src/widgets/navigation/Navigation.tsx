import { FC } from "react";
import { ContentTabs } from "./ContentTabs";
import { SearchInput } from "./SearchInput";

export const Navigation: FC = () => {
    return (
        <>
            <ContentTabs />
            <SearchInput />
        </>
    );
};
