import { FC } from "react";
import { SearchInput } from "../SearchInput";
import { ContentTabs } from "./ContentTabs";

export const Navigation: FC = () => {

    return (
        <>
            <ContentTabs />
            <SearchInput />
        </>
    );
};
