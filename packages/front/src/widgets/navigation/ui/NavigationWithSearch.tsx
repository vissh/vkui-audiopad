import { Navigation } from "entities/navigation";
import { SearchInput } from "features/search";
import { FC } from "react";

export const NavigationWithSearch: FC = () => {
    return (
        <Navigation>
            <SearchInput />
        </Navigation>
    );
};
