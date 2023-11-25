export const startListeningWebRequests = (): void => {
  // Обновление хедеров при каждом запросе.
  const requestFilter: chrome.webRequest.RequestFilter = { urls: ['*://*.vk.com/*'], types: ['xmlhttprequest'] }

  const extraInfoSpec: string[] = window.browser != null ? ['blocking', 'requestHeaders'] : ['blocking', 'requestHeaders', 'extraHeaders']
  chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, requestFilter, extraInfoSpec)
}

const onBeforeSendHeaders = (details: chrome.webRequest.WebRequestHeadersDetails): undefined | chrome.webRequest.BlockingResponse => {
  if (!isChrome(details) && !isFirefox(details)) {
    return
  }

  if (details.requestHeaders == null) {
    details.requestHeaders = []
  }

  const origin = 'https://vk.com'

  let originNotFound = true
  for (const header of details.requestHeaders) {
    if (header.name.toLowerCase() === 'origin') {
      header.value = origin
      originNotFound = false
      break
    }
  }

  if (originNotFound) {
    details.requestHeaders.push({ name: 'origin', value: origin })
  }

  return { requestHeaders: details.requestHeaders }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isChrome = (details: any): details is chrome.webRequest.WebRequestHeadersDetails => {
  return details.initiator?.startsWith('chrome-extension://')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFirefox = (details: any): details is browser.webRequest._WebRequestOnBeforeSendHeadersEvent => {
  return details.documentUrl?.startsWith('moz-extension://')
}
