export const startListeningOnUninstalled = (): void => {
  chrome.runtime.setUninstallURL('https://forms.gle/W867zaorTXqacZew8')
}
