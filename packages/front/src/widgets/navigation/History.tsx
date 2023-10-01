import { tabTypes } from "@vk-audiopad/common";
import { Icon16ChevronOutline } from "@vkontakte/icons";
import { Div, Spacing, Title } from "@vkontakte/vkui";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { useSetAtom } from "shared/lib/atom";
import { getTabName } from "shared/lib/utils";

type HistoryNavigationProps = {
    selectedTab: tabTypes.TTabWithHistory;
};

export const History: FC<HistoryNavigationProps> = ({ selectedTab }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    return (
        <Div
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                paddingTop: "10px",
                paddingLeft: "10px",
            }}
        >
            {selectedTab.history.map((tab) => (
                <>
                    <Title
                        level="3"
                        weight="3"
                        className="vkads_link vkads_hidden_overflow"
                        onClick={() => {
                            setSelectedTab(tab);
                        }}
                    >
                        {getTabName(tab)}
                    </Title>
                    &#8194;
                    <Spacing>
                        <Icon16ChevronOutline style={{ color: "var(--vkui--color_text_secondary)" }} />
                    </Spacing>
                    &#8194;
                </>
            ))}

            <Title
                level="3"
                weight="3"
                className="vkads_hidden_overflow"
            >
                {getTabName(selectedTab)}
            </Title>
        </Div>
    );
};
