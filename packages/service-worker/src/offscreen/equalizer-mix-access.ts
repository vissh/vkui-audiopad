export const equalizerMixAccess = async (): Promise<boolean> => {
  try {
    return await chrome.permissions.contains({ origins: ['https://*.okcdn.ru/*'] })
  } catch { return false }
}
