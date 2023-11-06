import { utils } from "@vk-audiopad/common";

export const startListeningOnInstalled = () => {
    // Действия при установке/обновлении расширения.
    chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
        if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
            utils.clearStorage();
        }
    });
};
