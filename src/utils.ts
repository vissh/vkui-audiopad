export function toHHMMSS(seconds: number): string {
    let s = new Date(seconds * 1000).toISOString();
    let result = seconds < 3600 ? s.substring(14, 19) : s.substring(11, 16);
    return result.startsWith('0') ? result.slice(1, result.length) : result;
}


export function* chunked(arr: any[], size: number, limit?: number) {
    let [start, end, counter] = [0, size, 0];

    while (1) {
        let slice = arr.slice(start, end);

        if (!slice.length) {
            break;
        }

        yield slice;

        counter++;

        if (limit && counter == limit) {
            break;
        }

        start = end;
        end = start + size;
    }
}
