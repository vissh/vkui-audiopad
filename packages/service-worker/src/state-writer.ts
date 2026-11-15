let writing = Promise.resolve()

export const serializeStateWrite = <T>(action: () => Promise<T>): Promise<T> => {
  const result = writing.then(action)
  writing = result.then(() => {}, () => {})
  return result
}
