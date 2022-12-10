

export async function vkFetch(url: string, params: Record<string, string>) {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.set(key, params[key]));

    // await fetch("https://vk.com/", {
    //     method: "GET",
    //     headers: {
    //         "x-requested-with": "XMLHttpRequest",
    //     },
    // });

    // const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    // await sleep(1000);

    const fetchPayload = () => fetch(url, {
        method: "POST",
        body: formData,
        headers: {
            "x-requested-with": "XMLHttpRequest",
        },
    })

    const jsonResp = await parseJson(await fetchPayload());
    
    if (jsonResp?.payload && jsonResp.payload.length === 2 && jsonResp.payload[0] === "3") {
        await fetch('https://vk.com');
        return await parseJson(await fetchPayload());
    }

    return jsonResp;
}


async function parseJson(response: Response) {
    const iconv = require("iconv-lite");
    const Buffer = require("buffer/").Buffer;

    const arrayBuffer = await response.arrayBuffer();
    const str = iconv.decode(Buffer.from(arrayBuffer), "win1251");

    return JSON.parse(str);
}
