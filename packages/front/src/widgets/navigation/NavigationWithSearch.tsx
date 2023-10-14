import { FC } from "react";
import { Navigation } from "./Navigation";
import { SearchInput } from "./SearchInput";

export const NavigationWithSearch: FC = () => {
    return (
        <Navigation>
            <SearchInput />
        </Navigation>
    );
};
