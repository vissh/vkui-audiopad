import axios from "axios";

export enum PlaylistType {
    GENERAL_MY_AUDIOS = "general:my_audios_block",
    RECENT_AUDIOS = "my:recent_audios",
    MY_AUDIOS = "my:my_audios",
};

export const vkFetch = async (url: string, params: Record<string, string>) => {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.set(key, params[key]));

    const fetchPayload = () => axios(url, {
        method: "POST",
        data: formData,
        headers: { "x-requested-with": "XMLHttpRequest" },
    });

    const jsonResp = await (await fetchPayload()).data;

    if (jsonResp?.payload && jsonResp.payload.length === 2 && jsonResp.payload[0] === "3") {
        await fetch("https://vk.com");
        return await (await fetchPayload()).data;
    }

    return jsonResp;
};
