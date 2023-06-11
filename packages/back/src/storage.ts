import { baseEnums, baseTypes, stateTypes } from "@vk-audiopad/common";

class State<T> {
    stateName: string;

    constructor(stateName: string) {
        this.stateName = stateName;
    }

    async get(): Promise<T | undefined> {
        return new Promise((resolve, _) => {
            chrome.storage.local.get([this.stateName], (result) => {
                resolve(result[this.stateName]);
            });
        });
    }

    async set(value: T) {
        return new Promise((resolve, _) => {
            chrome.storage.local.set({ [this.stateName]: value }, () => resolve(null));
        });
    }

    listen(callback: (value: T | undefined) => void) {
        chrome.storage.local.onChanged.addListener(changes => {
            if (changes.hasOwnProperty(this.stateName)) {
                callback(changes[this.stateName].newValue);
            }
        });
    }
}

const load = async (): Promise<Partial<stateTypes.TApplicationState>> => {
    return new Promise((resolve, _) => {
        chrome.storage.local.get((result) => {
            resolve(result as Partial<stateTypes.TApplicationState>);
        });
    });
};

const listen = (callback: (value: Partial<stateTypes.TApplicationState>) => void) => {
    chrome.storage.local.onChanged.addListener(changes => {
        const obj = Object.entries(changes).reduce((o, [key, { newValue }]) => Object.assign(o, { [key]: newValue }), {});
        callback(obj as Partial<stateTypes.TApplicationState>);
    });
};

const set = async (changes: Partial<stateTypes.TApplicationState>): Promise<void> => {
    return new Promise((resolve, _) => {
        chrome.storage.local.set(changes, resolve);
    });
};

export const storage = {
    set: set,
    load: load,
    listen: listen,
    activeTrack: new State<baseTypes.TTrackItem>("activeTrack"),
    played: new State<boolean>("played"),
    currentPlaylist: new State<baseTypes.TTitlePlaylist>("currentPlaylist"),
    audiosIds: new State<Array<baseTypes.TAudioTuple>>("audiosIds"),
    volume: new State<number>("volume"),
    shuffle: new State<boolean>("shuffle"),
    repeat: new State<baseEnums.ERepeat>("repeat"),
    durationMode: new State<baseEnums.EDurationMode>("durationMode"),
};
