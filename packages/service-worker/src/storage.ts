import { type commonTypes } from '@vk-audiopad/common'

class State<T> {
  stateName: string

  constructor (stateName: string) {
    this.stateName = stateName
  }

  async get (): Promise<T | undefined> {
    return await new Promise((resolve) => {
      chrome.storage.local.get([this.stateName], (result) => {
        resolve(result[this.stateName])
      })
    })
  }

  async set (value: T): Promise<void> {
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.stateName]: value }, () => { resolve(null) })
    })
  }

  listen (callback: (value: T | undefined) => void): void {
    chrome.storage.local.onChanged.addListener(changes => {
      if (Object.prototype.hasOwnProperty.call(changes, this.stateName)) {
        callback(changes[this.stateName].newValue)
      }
    })
  }
}

const load = async (): Promise<Partial<commonTypes.ApplicationState>> => {
  return await new Promise((resolve) => {
    chrome.storage.local.get((result) => {
      resolve(result as Partial<commonTypes.ApplicationState>)
    })
  })
}

const listen = (afterAddListener: (value: Partial<commonTypes.ApplicationState>) => void): void => {
  chrome.storage.local.onChanged.addListener(changes => {
    const obj = Object.entries(changes).reduce((o, [key, { newValue }]) => Object.assign(o, { [key]: newValue }), {})
    afterAddListener(obj as Partial<commonTypes.ApplicationState>)
  })
}

const set = async (changes: Partial<commonTypes.ApplicationState>): Promise<void> => {
  await new Promise((resolve) => {
    chrome.storage.local.set(changes, () => { resolve(null) })
  })
}

export const storage = {
  set,
  load,
  listen,
  activeTrack: new State<commonTypes.TrackItem>('activeTrack'),
  played: new State<boolean>('played'),
  currentPlaylist: new State<commonTypes.Playlist>('currentPlaylist'),
  audiosIds: new State<commonTypes.AudioTuple[]>('audiosIds'),
  volume: new State<number>('volume'),
  shuffle: new State<boolean>('shuffle'),
  repeat: new State<commonTypes.RepeatMode>('repeat'),
  durationMode: new State<commonTypes.DurationMode>('durationMode'),
  castToStatus: new State<boolean>('castToStatus'),
  hlsDebug: new State<boolean>('hlsDebug')
}
