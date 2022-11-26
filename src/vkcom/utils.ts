

export async function vkFetch(url: string, params: Record<string, string>) {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.set(key, params[key]));

    // await fetch("https://vk.com/", {
    //     method: "GET",
    //     headers: {
    //         "x-requested-with": "XMLHttpRequest",
    //     },
    // });

    const resp = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
            "x-requested-with": "XMLHttpRequest",
        },
    });

    return await parseJson(resp);
}


async function parseJson(response: Response) {
    const iconv = require("iconv-lite");
    const Buffer = require("buffer/").Buffer;

    const arrayBuffer = await response.arrayBuffer();
    const str = iconv.decode(Buffer.from(arrayBuffer), "win1251");

    return JSON.parse(str);
}
