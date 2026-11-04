const MIN_IDLE_TIME = 5 * 60 * 1000
let lastActivity = Date.now()
let activityRevision = 0

export const noteActivity = (): void => {
  lastActivity = Date.now()
  activityRevision++
}

export const getActivity = () => ({
  activityRevision,
  idle: Date.now() - lastActivity > MIN_IDLE_TIME
})
