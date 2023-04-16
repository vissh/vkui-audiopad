import { nextTrack, playNewRadio, playTrackFromNewPlaylist, previousTrack, repeat } from "../actions";
import { playerElement } from "../state";

export const startListiningChromeEvents = () => {
    // Действия, которые приходит из popup'а.
    chrome.runtime.onMessage.addListener(onMessage);

    // Обновление хедеров при каждом запросе.
    const requestFilter: chrome.webRequest.RequestFilter = { urls: ["*://*.vk.com/*"], types: ["xmlhttprequest"] };
    const extraInfoSpec: string[] = window["browser"] ? ["blocking", "requestHeaders"] : ["blocking", "requestHeaders", "extraHeaders"];
    chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, requestFilter, extraInfoSpec);

    // Действия при установке/обновлении расширения.
    chrome.runtime.onInstalled.addListener(onInstalled);
};

const onMessage = async (request: any, _: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const requestTypes = {
        activeTrack: async () => {
            if (request.data.playlist.isRadio) {
                return await playNewRadio(request.data.trackIndex, request.data.playlist);
            }
            return await playTrackFromNewPlaylist(request.data.trackIndex, request.data.playlist);
        },
        nextTrack: async () => {
            await nextTrack();
        },
        previousTrack: async () => {
            await previousTrack();
        },
        currentTime: async () => {
            playerElement.currentTime = request.data.value || 0;
            sendResponse();
        },
        repeat: async () => {
            await repeat();
        },
    };

    const handler = requestTypes[request.type];
    handler && await handler();
};

const onBeforeSendHeaders = (details: chrome.webRequest.WebRequestHeadersDetails) => {
    const isChromeExtension = details.initiator && details.initiator.startsWith("chrome-extension://");
    const isFirefoxExtension = details["documentUrl"] && details["documentUrl"].startsWith("moz-extension://");

    if (!isChromeExtension && !isFirefoxExtension) {
        return;
    }

    if (!details.requestHeaders) {
        details.requestHeaders = [];
    }

    const origin = "https://vk.com"

    let originNotFound = true;
    details.requestHeaders
        .filter(header => header.name.toLowerCase() === "origin")
        .every(header => {
            header.value = origin;
            originNotFound = false;
        });

    if (originNotFound) {
        details.requestHeaders.push({ name: "origin", value: origin });
    }

    return { requestHeaders: details.requestHeaders };
};

const onInstalled = (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        chrome.storage.local.clear();
    }
};
