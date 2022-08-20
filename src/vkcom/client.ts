import { ITrackItem } from "../types";


const AUDIO_ITEM_INDEX_ID = 26
const AUDIO_ITEM_INDEX_TITLE = 3
const AUDIO_ITEM_INDEX_PERFORMER = 4
const AUDIO_ITEM_INDEX_DURATION = 5
const AUDIO_ITEM_AVATAR = 14
// const AUDIO_ITEM_INDEX_OWNER_ID = 1
// const AUDIO_ITEM_INDEX_URL = 2
// const AUDIO_ITEM_INDEX_ALBUM_ID = 6
// const AUDIO_ITEM_INDEX_AUTHOR_ID = 7
// const AUDIO_ITEM_INDEX_AUTHOR_LINK = 8
// const AUDIO_ITEM_INDEX_LYRICS = 9
// const AUDIO_ITEM_INDEX_FLAGS = 10
// const AUDIO_ITEM_INDEX_CONTEXT = 11
// const AUDIO_ITEM_INDEX_EXTRA = 12
// const AUDIO_ITEM_INDEX_HASHES = 13


export async function audioSearch(
    value: string,
    callback: (tracks: ITrackItem[]) => void
) {
    const form = new FormData();
    form.set('type', 'search');
    form.set('act', 'load_section');
    form.set('al', '1');
    form.set('owner_id', '8902548');
    form.set('offset', '0');
    form.set('album_id', '');
    form.set('search_lyrics', '0');
    form.set('search_history', '0');
    form.set('search_sort', '0');
    form.set('search_performer', '0');
    form.set('search_q', value);
    form.set('claim', '0');

    const iconv = require('iconv-lite');
    const Buffer = require('buffer/').Buffer;

    const resp = await fetch('https://vk.com/al_audio.php', {
        method: 'POST',
        body: form,
        headers: {
            'x-requested-with': 'XMLHttpRequest',
        },
    });

    const arrayBuffer = await resp.arrayBuffer();
    const str = iconv.decode(Buffer.from(arrayBuffer), 'win1251');
    const data = JSON.parse(str);
    const tracks: ITrackItem[] = [];

    data.payload[1][0].list.forEach((element: any[]) => {
        tracks.push({
            id: element[AUDIO_ITEM_INDEX_ID],
            image: element[AUDIO_ITEM_AVATAR].split(',')[0],
            artist: element[AUDIO_ITEM_INDEX_TITLE],
            title: element[AUDIO_ITEM_INDEX_PERFORMER],
            duration: element[AUDIO_ITEM_INDEX_DURATION],
        })
    });

    callback(tracks);
}
