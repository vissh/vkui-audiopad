const sendCounter = () => {
  const image = document.createElement('img')
  image.alt = ''
  image.hidden = true
  image.src = 'https://top-fwz1.mail.ru/counter?id=3298105;js=na'
  document.body.append(image)
}

export const registerUsageCounter = () => {
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(sendCounter, { timeout: 2000 })
    else window.setTimeout(sendCounter, 0)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
}
