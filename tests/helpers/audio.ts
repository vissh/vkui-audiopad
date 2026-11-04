import { vi } from 'vitest'

export class TestAudio extends EventTarget {
  src = ''
  preload = ''
  crossOrigin: string | null = null
  volume = 1
  currentTime = 0
  duration = 0
  paused = true
  ended = false
  error: MediaError | null = null
  readyState = 4
  play = vi.fn(async () => {
    this.paused = false
    this.dispatchEvent(new Event('playing'))
  })

  pause = vi.fn(() => {
    if (!this.paused) {
      this.paused = true
      this.dispatchEvent(new Event('pause'))
    }
  })

  removeAttribute (name: string): void {
    if (name === 'src') this.src = ''
  }
}

export const installAudio = (configure?: (audio: TestAudio) => void) => {
  const instances: TestAudio[] = []
  vi.stubGlobal('Audio', class extends TestAudio {
    constructor () {
      super()
      configure?.(this)
      instances.push(this)
    }
  })
  return instances
}
