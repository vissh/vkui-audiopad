import { useSyncExternalStore } from "react";

interface Atom<AtomType> {
    get: () => AtomType;
    set: (newValue: AtomType) => void;
    subscribe: (callback: (newValue: AtomType) => void) => () => void;
}

export const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
    return [useSyncExternalStore(atom.subscribe, atom.get), atom.set];
};

export const useAtomValue = <T>(atom: Atom<T>): T => {
    return useSyncExternalStore(atom.subscribe, atom.get);
};

export const useSetAtom = <T>(atom: Atom<T>): (newValue: T) => void => {
    return atom.set;
};

export const atom = <T>(initialValue: T): Atom<T> => {
    let value = initialValue;
    const subscribes = new Set<(newValue: T) => void>();

    return {
        get: () => value,
        set: (newValue) => {
            value = newValue;
            subscribes.forEach(callback => callback(value));
        },
        subscribe: (callback) => {
            subscribes.add(callback);
            return () => subscribes.delete(callback);
        },
    };
};

export const storageAtom = <T>(keyName: string, initialValue: T, defaultValue?: T): Atom<T> => {
    let value = initialValue;
    const subscribes = new Set<(newValue: T) => void>();

    const set = (newValue: T | undefined) => {
        if (typeof newValue === "object" && JSON.stringify(value) === JSON.stringify(newValue)) {
            return;
        }

        value = newValue === undefined ? (defaultValue === undefined ? initialValue : defaultValue) : newValue;
        subscribes.forEach(callback => callback(value));
    };

    chrome.storage.local.get(keyName, (items) => set(items[keyName]));

    chrome.storage.local.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }) => {
        const change = changes[keyName];
        if (change !== undefined) {
            set(change.newValue);
        }
    });

    return {
        get: () => value,
        set: (newValue) => {
            set(newValue);
            chrome.storage.local.set({ [keyName]: newValue });
        },
        subscribe: (callback) => {
            subscribes.add(callback);
            return () => subscribes.delete(callback);
        },
    };
};
