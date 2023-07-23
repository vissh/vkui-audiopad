import { baseTypes, vkFetch } from "@vk-audiopad/common";
import { serializeError } from "serialize-error";

export const fetchWebToken = async (): Promise<baseTypes.TWebToken> => {
    try {
        return await _fetchAppWebToken();
    } catch (err) {
        return {
            userId: "",
            accessToken: "",
            expires: 0,
            logoutHash: "",
            error: {
                type: "exception",
                serializedError: serializeError(err),
            }
        };
    }
};

const _fetchAppWebToken = async (): Promise<baseTypes.TWebToken> => {
    const jsonData = await vkFetch("https://login.vk.com/?act=web_token", {
        version: "1",
        app_id: "6287487",
        access_token: "",
    });

    if (jsonData.type === "error" && jsonData.error_info === "unauthorized") {
        return {
            userId: "",
            accessToken: "",
            expires: 0,
            logoutHash: "",
            error: {
                type: "unauthorized",
                serializedError: null,
            }
        }
    } else if (jsonData.type !== "okay") {
        throw Error("web_token was not received. response: " + JSON.stringify(jsonData));
    }

    return {
        userId: jsonData.data.user_id.toString(),
        accessToken: jsonData.data.access_token,
        expires: jsonData.data.expires,
        logoutHash: jsonData.data.logout_hash,
        error: null,
    };
};
