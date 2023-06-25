import { useQuery } from "@tanstack/react-query";
import { baseTypes, utils } from "@vk-audiopad/common";
import { v4 as uuid4 } from "uuid";
import { useSetAtom } from "../../core/atom";
import { webTokenAtom } from "../../core/atoms";
import { fetchWebToken } from "./fetchers";

const queryKey: Readonly<String[]> = ["webToken"];

export const useUpdateWebToken = () => {
    return useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const setWebToken = useSetAtom(webTokenAtom);
            const webToken = await fetchWebToken();
            setWebToken(webToken);
            setTimeout(() => updateWebToken(webToken), 1);
        },
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

const updateWebToken = (webToken: baseTypes.TWebToken) => {
    if (webToken.error?.type === "unauthorized") {
        return logout(webToken);
    }

    chrome.storage.local.get(["userId", "deviceId"], (items) => {
        if (webToken.error) {
            return logout(webToken);
        }

        login(items.userId, items.deviceId, webToken);
    });
};

const logout = (webToken: baseTypes.TWebToken) => {
    const items = {
        webToken: webToken,
    };

    chrome.storage.local.set(items, () => {
        utils.clearStorage(Object.keys(items));
    });
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

    items.deviceId = "";
    chrome.storage.local.set(items, () => {
        utils.clearStorage(Object.keys(items));
    });
};
