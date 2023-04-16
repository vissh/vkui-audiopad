import { createAsyncThunk } from "@reduxjs/toolkit";
import { storage, types } from "@vk-audiopad/common";

export const setSelectedTab = createAsyncThunk(
    "storage/setSelectedTab",
    async (selectedTab: types.SelectedTabs) => await storage.set({ selectedTab: selectedTab })
);
