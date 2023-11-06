import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const selectedTabAtom = storageAtom("selectedTab", initialState.InitialSelectedTab.selectedTab, initialState.DefaultSelectedTab.selectedTab);
