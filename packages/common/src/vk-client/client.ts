import { win1251ResponseToUTF8String } from "./utils";

export const vkFetch = async (url: string, params: Record<string, string>) => {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.set(key, params[key]));

    const fetchPayload = async () => {
        const resp = await fetch(url, {
            method: "POST",
            body: formData,
            headers: { "x-requested-with": "XMLHttpRequest" },
        });

        return JSON.parse(await win1251ResponseToUTF8String(resp));
    };

    const jsonResp = await fetchPayload();

    if (jsonResp?.payload && jsonResp.payload.length === 2 && jsonResp.payload[0] === "3") {
        await fetch("https://vk.com");
        return await fetchPayload();
    }

    return jsonResp;
};
