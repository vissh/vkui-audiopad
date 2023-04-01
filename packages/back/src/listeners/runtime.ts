import { types } from "@vk-audiopad/common";
import { nextTrack, playNewRadio, playNewTrack, previousTrack } from "../actions";
import { playerElement } from "../state";
import { sendListenedData } from "../utils";

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
    switch (request.type) {
        case "activeTrack": {
            if (request.data.playlist.isRadio) {
                return await playNewRadio(request.data.trackIndex, request.data.playlist);
            }
            sendListenedData(types.EndOfStreamReason.New);
            return await playNewTrack(request.data.trackIndex, request.data.playlist);
        }
        case "nextTrack": {
            sendListenedData(types.EndOfStreamReason.Next);
            await nextTrack();
            break;
        }
        case "previousTrack": {
            sendListenedData(types.EndOfStreamReason.Prev);
            await previousTrack();
            break;
        }
        case "currentTime": {
            playerElement.currentTime = request.data.value || 0;
            sendResponse();
            break;
        }
        default:
            break;
    }
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
