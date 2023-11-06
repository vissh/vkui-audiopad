import { baseTypes, utils } from "@vk-audiopad/common";
import { v4 as uuid4 } from "uuid";

export const updateWebToken = (webToken: baseTypes.TWebToken) => {
    if (webToken.error?.type === "unauthorized") {
        return logout();
    }

    chrome.storage.local.get(["userId", "deviceId"], (items) => {
        if (webToken.error) {
            return logout();
        }

        login(items.userId, items.deviceId, webToken);
    });
};

const logout = () => {
    utils.clearStorage();
};

const login = (userId: string, deviceId: string, webToken: baseTypes.TWebToken) => {
    const items = {
        userId: webToken.userId,
        webToken: webToken,
        deviceId: deviceId || uuid4(),
    };

    if (userId === webToken.userId) {
        return chrome.storage.local.set(items);
    }

    items.deviceId = uuid4();
    chrome.storage.local.set(items, () => {
        const saveCustomKeys = Object.keys(items);
        utils.clearStorage(saveCustomKeys);
    });
};
