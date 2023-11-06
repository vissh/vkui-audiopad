
export const startListeningWebRequests = () => {
    // Обновление хедеров при каждом запросе.
    const requestFilter: chrome.webRequest.RequestFilter = { urls: ["*://*.vk.com/*"], types: ["xmlhttprequest"] };
    const extraInfoSpec: string[] = window["browser"] ? ["blocking", "requestHeaders"] : ["blocking", "requestHeaders", "extraHeaders"];
    chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, requestFilter, extraInfoSpec);
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
