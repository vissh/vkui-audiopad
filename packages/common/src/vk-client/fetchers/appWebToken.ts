import { TypeWebToken } from "../../types";
import { vkFetch } from "../client";

export const appWebToken = async (): Promise<TypeWebToken> => {
    const parsedData = await vkFetch("https://login.vk.com/?act=web_token", {
        version: "1",
        app_id: "6287487",
        access_token: "",
    });

    if (parsedData.type === "error" && parsedData.error_info === "unauthorized") {
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
    } else if (parsedData.type !== "okay") {
        throw Error("web_token was not received. response: " + JSON.stringify(parsedData));
    }

    return {
        userId: parsedData.data.user_id.toString(),
        accessToken: parsedData.data.access_token,
        expires: parsedData.data.expires,
        logoutHash: parsedData.data.logout_hash,
        error: null,
    };
};
