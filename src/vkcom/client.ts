import { parseJson } from "./utils";

export enum PlaylistType {
    GENERAL_MY_AUDIOS = "general:my_audios_block",
    RECENT_AUDIOS = "my:recent_audios",
    MY_AUDIOS = "my:my_audios",
};

export async function vkFetch(url: string, params: Record<string, string>) {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.set(key, params[key]));

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

export async function userAccessToken() {

}


// https://vk.com/al_audio.php?act=section
// act: section
// act=section&al=1&claim=0&is_layer=0&owner_id=8902548&performer=1&q=%D0%A1%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%BE%D0%BD%D0%B8%D1%82%20x%20104%20x%20Truwer&section=search


// https://vk.com/al_audio.php?act=section
// act=section&al=1&claim=0&is_layer=0&owner_id=8902548&section=explore
// https://vk.com/al_audio.php?act=load_catalog_section
// al=1&section_id=PUldVA8FR0RzSVNUUEwbCikZDFQZFlJEfFpFVA0WUV5_W1tDAQwW&start_from=PUlYVA8AFg
// section_id и start_from брать из explore payload.1.1.sectionId, next_from


// https://login.vk.com/?act=web_token
// version	"1"
// app_id	"7598768"
// access_token	""
