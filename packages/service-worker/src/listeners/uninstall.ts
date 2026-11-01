export const startListeningOnUninstalled = (): void => {
  void chrome.runtime.setUninstallURL('https://forms.gle/W867zaorTXqacZew8')
}
