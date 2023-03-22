import { v4 as uuid4 } from "uuid";
import { EnumRepeat, TypeApplicationState, TypeAudioIds, TypeTitlePlaylist, TypeTrackItem, TypeWebToken } from "./types";

class State<T> {
    stateName: string;

    constructor(stateName: string) {
        this.stateName = stateName;
    }

    async get(): Promise<T> {
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

export const load = async (): Promise<Partial<TypeApplicationState>> => {
    return new Promise((resolve, _) => {
        chrome.storage.local.get((result) => {
            resolve(result as Partial<TypeApplicationState>);
        });
    });
};

export const listen = (callback: (value: Partial<TypeApplicationState>) => void) => {
    chrome.storage.local.onChanged.addListener(changes => {
        const obj = Object.entries(changes).reduce((o, [key, { newValue }]) => Object.assign(o, { [key]: newValue }), {});
        callback(obj as Partial<TypeApplicationState>);
    });
};

export const set = async (changes: Partial<TypeApplicationState>): Promise<void> => {
    return new Promise((resolve, _) => {
        chrome.storage.local.set(changes, resolve);
    });
};

export const updateWebToken = async (webToken: TypeWebToken) => {
    return new Promise(resolve => {
        const successCallback = () => resolve(null);

        chrome.storage.local.get(["userId", "deviceId"], (items) => {
            if (webToken.error) {
                return logout(webToken, successCallback);
            }

            login(items.userId, items.deviceId, webToken, successCallback);
        });
    });
};

const logout = (webToken: TypeWebToken, successCallback: Function) => {
    chrome.storage.local.clear();
    chrome.storage.local.set({ webToken: webToken }, () => {
        successCallback();
    });
};

const login = (userId: string, deviceId: string, webToken: TypeWebToken, successCallback: Function) => {
    if (userId !== webToken.userId) {
        chrome.storage.local.clear();
        deviceId = "";
    }

    chrome.storage.local.set({ userId: webToken.userId, webToken: webToken, deviceId: deviceId || uuid4() }, () => {
        successCallback();
    });
};

export const activeTrack = new State<TypeTrackItem>("activeTrack");
export const played = new State<boolean>("played");
export const currentPlaylist = new State<TypeTitlePlaylist>("currentPlaylist");
export const audiosIds = new State<TypeAudioIds>("audiosIds");
export const volume = new State<number>("volume");
export const repeat = new State<EnumRepeat>("repeat");
