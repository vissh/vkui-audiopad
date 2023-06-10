import { ApplicationControls, ApplicationSettings } from "./initialState";

export function* chunked(arr: any[], size: number, limit?: number) {
    let [start, end, counter] = [0, size, 0];

    while (1) {
        let slice = arr.slice(start, end);

        if (!slice.length) {
            break;
        }

        yield slice;

        counter++;

        if (limit && counter === limit) {
            break;
        }

        start = end;
        end = start + size;
    }
}

export const toHHMMSS = (seconds: number): string => {
    let s = new Date(seconds * 1000).toISOString();
    let result = seconds < 3600 ? s.substring(14, 19) : s.substring(11, 16);
    return result.startsWith("0") ? result.slice(1, result.length) : result;
};

const saveSettingsKeys = new Set([
    ...Object.keys(ApplicationControls),
    ...Object.keys(ApplicationSettings),
]);

export const clearStorage = (saveCustomKeys?: Array<string>, callback?: () => void) => {
    const saveKeys = saveCustomKeys === undefined ? saveSettingsKeys : new Set([...saveSettingsKeys, ...saveCustomKeys]);

    chrome.storage.local.get((items) => {
        const removeKeys = Object.keys(items).filter(x => !saveKeys.has(x));
        chrome.storage.local.remove(removeKeys, callback);
    });
};
