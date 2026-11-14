import { errorDiagnostics } from '@vk-audiopad/common'

export const createErrorReport = (error: unknown) => {
  let extensionVersion = 'unknown'
  try { extensionVersion = chrome.runtime.getManifest().version } catch {}
  const browsers = navigator.userAgent.match(/(?:Firefox|Edg|Chrome)\/[\d.]+/g)
  const browser = browsers?.[browsers.length - 1] ?? 'unknown'
  const assets = [...document.scripts].flatMap(script => {
    const asset = script.src.match(/\/(assets\/[\w-]+\.js)$/)?.[1]
    return asset == null ? [] : [asset]
  })
  return { reportVersion: 1, extensionVersion, browser, assets, error: errorDiagnostics.describeError(error) }
}

export const errorHint = (error: unknown): string => {
  const details = errorDiagnostics.describeError(error)
  if ('kind' in details) {
    if (details.kind === 'rate-limit') return 'VK ограничил частоту запросов. Подождите немного и повторите попытку'
    if (details.kind === 'unauthorized') return 'Проверьте вход на vk.ru и заново откройте расширение'
    if (details.kind === 'network' || details.kind === 'timeout') return 'Проверьте соединение и повторите попытку'
    if (details.kind === 'format' && details.contentType === 'html') return 'VK вернул веб-страницу вместо данных. Откройте vk.ru и проверьте, не требуется ли вход или проверка безопасности'
    if (details.kind === 'session-changed') return 'Аккаунт VK изменился. Обновите интерфейс'
  }
  return 'Не удалось получить данные VK. Повторите попытку позже'
}
